/// <reference path="./../../typings/index.d.ts" />

import {IBoom, IReply, Response} from "hapi";
import {users} from "../../modules/database";
import {findPlan} from "../../modules/plans";
import {Server, Request, User} from "gearworks";
import {badRequest, expectationFailed} from "boom";
import {strategies, setUserAuth} from "../../modules/auth";
import {getRequestDomain,getRequestHost} from "../../modules/requests";
import {Routes as WebhookRoutes} from "../../routes/webhooks/webhook-routes";
import {
    isAuthenticRequest, 
    authorize, 
    RecurringCharges, 
    RecurringCharge, 
    Webhooks, 
    Infrastructure, 
    Shops
} from "shopify-prime";

export const Routes = {
    GetShopify: "/connect/shopify",
    GetShopifyActivate: "/connect/shopify/activate",
}

export function registerRoutes(server: Server)
{
    server.route({
        method: "GET",
        path: Routes.GetShopify,
        config: {
            auth: {
                strategies: [strategies.basicAuth, strategies.shopifyRequest],
            }
        },
        handler: {
            async: (request, reply) => connectShopify(server, request, reply),
        }
    });
    
    server.route({
        method: "GET",
        path: Routes.GetShopifyActivate,
        config: {
            auth: {
                strategies: [strategies.basicAuth, strategies.shopifyRequest],
            }
        },
        handler: {
            async: (request, reply) => activateShopifyPlan(server, request, reply),
        }
    })
}

export async function connectShopify(server: Server, request: Request, reply: IReply): Promise<IBoom | Response>
{
    const query: {code: string, shop: string, hmac: string} = request.query;
    const accessToken = await authorize(query.code, query.shop, server.app.shopifyApiKey, server.app.shopifySecretKey);
    
    // Grab the user's shop name and id and their database record
    const shopData = (await new Shops(query.shop, accessToken).get({fields: ["name,id"]}));
    let user = await users.get(request.auth.credentials.userId) as User;
    
    // Store the user's shop data
    user.shopifyDomain = query.shop;
    user.shopifyAccessToken = accessToken;
    user.shopifyShopName = shopData.name;
    user.shopifyShopId = shopData.id;
    
    const response = await users.put(user);
    
    if (!response.ok)
    {
        console.error(`Failed to update user ${user._id}'s Shopify access token`);
        
        return reply(expectationFailed("Could not save Shopify access token."));
    }
    
    // Update the user's auth token
    await setUserAuth(request, user);

    const redirect = reply.redirect("/");

    if (getRequestHost(request).toLowerCase() === "localhost")
    {
        // Don't create any webhooks unless this app is running on a real domain. Webhooks cannot point to localhost.
        return redirect;
    }

    // Create the AppUninstalled webhook immediately after the user accepts installation
    const webhooks = new Webhooks(user.shopifyDomain, user.shopifyAccessToken);

    // Ensure the webhook doesn't already exist
    if ((await webhooks.list({topic: "app/uninstalled", fields: ["id"], limit: 1})).length === 0)
    {
        await webhooks.create({
            address: `${getRequestDomain(request)}/${WebhookRoutes.GetAppUninstalled}?shopId=${user.shopifyShopId}`,
            topic: "app/uninstalled"
        })
    }
    
    return redirect;
}

export async function activateShopifyPlan(server: Server, request: Request, reply: IReply)
{
    const query: {shop: string, hmac: string, charge_id: number, plan_id: string} = request.query;
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
        return reply.redirect("/setup/plans");
    }
    
    await service.activate(charge.id);
    
    // Update the user's planid
    let user = await users.get(request.auth.credentials.userId) as User;
    user.planId = plan.id;
    
    const update = await users.put(user);
    
    if (!update.ok)
    {
        throw new Error("Activated user plan but failed to save plan id.");
    }
    
    await setUserAuth(request, user);
    
    return reply.redirect("/");
}