/// <reference path="./../../typings/typings.d.ts" />

import * as joi from "joi";
import * as boom from "boom";
import {IReply} from "hapi";
import {Users} from "../../modules/database";
import {hashSync, compareSync} from "bcrypt";
import {Server, Request, User} from "gearworks";
import {findPlan, Plans} from "../../modules/plans";
import {humanizeError} from "../../modules/validation";
import {getRequestDomain} from "../../modules/requests";
import {setUserAuth, strategies} from "../../modules/auth";
import {RecurringCharges, RecurringCharge} from "shopify-prime";
import {IProps as BillingProps} from "../../views/account/billing";
import {IProps as SettingsProps} from "../../views/account/settings";

export const Routes = {
    GetSettings: "/account/settings",
    PostSettings: "/account/settings",
    GetBilling: "/account/billing",
    PostBilling: "/account/billing",
    UpdatePlan: "/account/update-plan",
}

export const JoiValidation = {
    postSettings: joi.object().keys({
        oldPassword: joi.string().label("Old Password"),
        newPassword: joi.string().min(6).label("New Password"),
        confirmPassword: joi.string().label("New Password"),
    }),
    postBilling: joi.object().keys({
        plan: joi.string().only(Plans.map(p => p.id)).label("Plan")
    }),
}

export function registerRoutes(server: Server)
{
    server.route({
        path: "/account",
        method: "GET",
        handler: (request, reply) => reply.redirect(Routes.GetSettings),
    })

    server.route({
        path: Routes.GetSettings,
        method: "GET",
        handler: {
            async: (request, reply) => getSettings(server, request, reply),
        }
    })

    server.route({
        path: Routes.PostSettings,
        method: "POST",
        handler: {
            async: (request, reply) => postSettings(server, request, reply)
        }
    })

    server.route({
        path: Routes.GetBilling,
        method: "GET",
        handler: {
            async: (request, reply) => getBilling(server, request, reply),
        }
    })

    server.route({
        path: Routes.PostBilling,
        method: "POST",
        handler: {
            async: (request, reply) => postBilling(server, request, reply),
        }
    })

    server.route({
        path: Routes.UpdatePlan,
        method: "GET",
        config: {
            auth: {
                strategies: [strategies.basicAuth, strategies.shopifyRequest],
            }
        },
        handler: {
            async: (request, reply) => updatePlan(server, request, reply)
        }
    })
}

export async function getSettings(server: Server, request: Request, reply: IReply)
{
    const props: SettingsProps = {
        title: "Account Settings.",
    }

    return reply.view("account/settings.js", props);
}

export async function postSettings(server: Server, request: Request, reply: IReply)
{
    function view(error: string, success?: boolean)
    {
        const props: SettingsProps = {
            title: "Account Settings.",
            success: !!success,
        }

        return reply.view("account/settings.js", props);
    }

    const validation = joi.validate<{newPassword: string, oldPassword: string, confirmPassword: string}>(request.payload, JoiValidation.postSettings);

    if (validation.error)
    {
        return view(humanizeError(validation.error));
    }

    const payload = validation.value;

    if (payload.confirmPassword !== payload.newPassword)
    {
        return view("New Password does not match the confirmation.");
    }

    const user = await Users.get<User>(request.auth.credentials.userId);

    // Ensure the user's current password is correct
    if(! compareSync(payload.oldPassword, user.hashedPassword))
    {
        return view("Old Password does not match.");
    }
    
    // Change the user's password
    user.hashedPassword = hashSync(payload.newPassword, 10);

    const update = await Users.put(user);

    if (!update.ok)
    {
        console.error("Failed to update user's password.", update);

        return reply(boom.expectationFailed("Failed to update user's password.", update));
    }

    await setUserAuth(request, user);

    return view(undefined, true);
}

export async function getBilling(server: Server, request: Request, reply: IReply)
{
    const artifacts = request.auth.artifacts;
    const service = new RecurringCharges(artifacts.shopDomain, artifacts.shopToken);
    const charge = await service.get(artifacts.chargeId);
    const props: BillingProps = {
        title: "Billing Settings.",
        plan: findPlan(request.auth.artifacts.planId),
        trialEndsOn: charge.trial_ends_on,
        billingOn: charge.billing_on,
    }

    return reply.view("account/billing.js", props);
}

export async function postBilling(server: Server, request: Request, reply: IReply)
{
    async function view(error: string)
    {
        const artifacts = request.auth.artifacts;
        const service = new RecurringCharges(artifacts.shopDomain, artifacts.shopToken);
        const charge = await service.get(artifacts.chargeId);
        const props: BillingProps = {
            title: "Billing Settings.",
            plan: findPlan(request.auth.artifacts.planId),
            trialEndsOn: charge.trial_ends_on,
            billingOn: charge.billing_on,
            error: error,
        }

        return reply.view("account/billing.js", props);
    }

    const artifacts = request.auth.artifacts;
    const validation = joi.validate<{plan: string}>(request.payload, JoiValidation.postBilling);

    if (validation.error)
    {
        return await view(humanizeError(validation.error));
    }

    const plan = findPlan(validation.value.plan);

    if (plan.id === artifacts.planId)
    {
        return reply.redirect(Routes.GetBilling);
    }

    const service = new RecurringCharges(artifacts.shopDomain, artifacts.shopToken);

    // Get the user's current charge so we can transfer their trial days 
    const currentCharge = await service.get(artifacts.chargeId, {fields: ["trial_ends_on"]});

    // Figure out the new trial length by checking if current charge's trial_ends_on hasn't happened yet (Today < Tomorrow)
    const trialDays = Math.round((new Date(currentCharge.trial_ends_on).valueOf() - new Date().valueOf()) / 1000 / 60 / 60 / 24);

    // The new charge will replace the user's current charge on activation.
    const charge = await service.create({
        name: plan.name,
        price: plan.price,
        test: !server.app.isLive,
        trial_days: trialDays > 0 ? trialDays : 0,
        return_url: `${getRequestDomain(request)}${Routes.UpdatePlan}?plan_id=${plan.id}`.toLowerCase(),
    });
    
    //Send the user to the confirmation url
    return reply.redirect(charge.confirmation_url);
}

export async function updatePlan(server: Server, request: Request, reply: IReply)
{
    const query: {plan_id: string, charge_id: number} = request.query;

    const plan = findPlan(query.plan_id);
    const artifacts = request.auth.artifacts;
    const service = new RecurringCharges(artifacts.shopDomain, artifacts.shopToken);
    let charge: RecurringCharge;
    
    try
    {
        charge = await service.get(query.charge_id);
        
        if (charge.status !== "accepted")
        {
            //Charges can only be activated when they've been accepted
            throw new Error(`Charge status was ${charge.status}`);
        }
    }
    catch (e)
    {
        console.error("Recurring charge error", e);
        
        // Charge has expired or was declined. Send the user to select a new plan.
        return reply.redirect(Routes.GetBilling);
    }
    
    await service.activate(charge.id);
    
    // Update the user's planid
    let user = await Users.get<User>(request.auth.credentials.userId);
    user.planId = plan.id;
    user.chargeId = charge.id;
    
    const update = await Users.put(user);
    
    if (!update.ok)
    {
        throw new Error("Activated new subscription plan but failed to save plan id.");
    }
    
    await setUserAuth(request, user);

    return reply.redirect(Routes.GetBilling);
}