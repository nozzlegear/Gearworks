/// <reference path="./../../typings/typings.d.ts" />

import * as joi from "joi";
import * as boom from "boom";
import * as pouch from "pouchdb";
import {IReply, IBoom} from "hapi";
import {users} from "../../modules/database";
import {Server, User, Request} from "gearworks";
import {basicStrategyName} from "../../modules/auth";
import {humanizeError} from "../../modules/validation";
import {getRequestDomain} from "../../modules/requests";
import {IProps as SetupProps} from "../../views/setup/setup";
import {IProps as PlansProps} from "../../views/setup/plans";
import {plans as activePlans, findPlan} from "../../modules/plans";
import {
    isValidShopifyDomain, 
    buildAuthorizationUrl, 
    AuthScope, 
    RecurringCharges, 
    RecurringCharge
} from "shopify-prime"; 

const setupValidation = joi.object().keys({
    shopUrl: joi.string().hostname(),
})

const planValidation = joi.object().keys({
    planId: joi.string().only(activePlans.map(p => p.id))
})

export function registerRoutes(server: Server)
{
    server.route({
        method: "GET",
        path: "/setup",
        config: {
            auth: basicStrategyName,
        },
        handler: {
            async: (request, reply) => getSetupForm(server, request, reply)
        }
    });
    
    server.route({
        method: "POST",
        path: "/setup",
        config: {
            auth: basicStrategyName,
        },
        handler: {
            async: (request, reply) => setup(server, request, reply)
        }
    });
    
    server.route({
        method: "GET",
        path: "/setup/plans",
        config: {
            auth: basicStrategyName,
        },
        handler: {
            async: (request, reply) => getPlans(server, request, reply)
        }
    });
    
    server.route({
        method: "POST",
        path: "/setup/plans",
        config: {
            auth: basicStrategyName,
        },
        handler: {
            async: (request, reply) => selectPlan(server, request, reply)
        }
    })
}

export async function getSetupForm(server: Server, request: Request, reply: IReply)
{
    const props: SetupProps = {
        title: "Connect your Shopify store.",
    };
    
    return reply.view("setup/setup.js", props);
}

export async function setup(server: Server, request: Request, reply: IReply)
{
    let payload = request.payload as {shopUrl: string};
    const props: SetupProps = {
        title: "Connect your Shopify store.",
        shopUrl: payload.shopUrl,
    };
    const validation = joi.validate(payload, setupValidation);
    
    if (validation.error)
    {
        props.error = humanizeError(validation.error);
        
        return reply.view("setup/setup.js", props);
    }
    
    payload = validation.value;
    
    if (! (await isValidShopifyDomain(payload.shopUrl)))
    {
        props.error = "It looks like the URL you entered is not a valid Shopify domain.";
        
        return reply.view("setup/setup.js", props);
    }
    
    const scopes: AuthScope[] = ["read_orders", "write_orders"]
    const redirect = (getRequestDomain(request) + "/connect/shopify").toLowerCase();
    const oauthUrl = await buildAuthorizationUrl(scopes, payload.shopUrl, server.app.shopifyApiKey, redirect);

    return reply.redirect(oauthUrl);
}

export async function getPlans(server: Server, request: Request, reply: IReply)
{
    // Ensure user has connected their store before they can select a plan
    if (! request.auth.artifacts.shopToken)
    {
        return reply.redirect("/setup");
    }
    
    const props: PlansProps = {
        title: "Select your plan.",
        plans: activePlans,
    }
    
    return reply.view("setup/plans.js", props);
}

export async function selectPlan(server: Server, request: Request, reply: IReply): Promise<any>
{
    // Ensure user has connected their store before they can select a plan
    if (! request.auth.artifacts.shopToken)
    {
        return reply.redirect("/setup");
    }
    
    const props: PlansProps = {
        title: "Select your plan.",
        plans: activePlans,
    };
    let payload: {planId: string} = request.payload;
    
    const validation = joi.validate(request.payload, planValidation);
    
    if (validation.error)
    {
        console.error("Selected invalid plan", validation.error);
        
        return reply.view("setup/plans.js", props);
    }
    
    payload = validation.value;

    const plan = findPlan(payload.planId);
    const artifacts = request.auth.artifacts;
    const service = new RecurringCharges(artifacts.shopDomain, artifacts.shopToken); 
    const charge = await service.create({
        name: plan.name,
        price: plan.price,
        test: !server.app.isLive,
        trial_days: 0,
        return_url: (getRequestDomain(request) + `/connect/shopify/activate?plan_id=${plan.id}`).toLowerCase(),
    });
    
    //Send the user to the confirmation url
    return reply.redirect(charge.confirmation_url);
}
