/// <reference path="./../../typings/index.d.ts" />

import {IBoom, IReply, Response} from "hapi";
import {users} from "../../modules/database";
import {findPlan} from "../../modules/plans";
import {Server, Request, User} from "gearworks";
import {badRequest, expectationFailed} from "boom";
import {basicStrategyName, setAuthCookie, shopifyRequestStrategyName} from "../../modules/auth";
import {isAuthenticRequest, authorize, RecurringCharges, RecurringCharge, ShopifyError, Shops} from "shopify-prime";

export function registerRoutes(server: Server)
{
    server.route({
        method: "GET",
        path: "/connect/shopify",
        config: {
            auth: {
                strategies: [basicStrategyName, shopifyRequestStrategyName],
            }
        },
        handler: {
            async: (request, reply) => connectShopify(server, request, reply),
        }
    });
    
    server.route({
        method: "GET",
        path: "/connect/shopify/activate",
        config: {
            auth: {
                strategies: [basicStrategyName, shopifyRequestStrategyName],
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
    
    // Grab the user's shopname and their database record
    const shopName = (await new Shops(query.shop, accessToken).get({fields: ["name"]})).name;
    let user = await users.get(request.auth.credentials.userId) as User;
    
    // Store the user's shop data
    user.shopifyDomain = query.shop;
    user.shopifyAccessToken = accessToken;
    user.shopifyShop = shopName;
    
    const response = await users.put(user);
    
    if (!response.ok)
    {
        console.error(`Failed to update user ${user._id}'s Shopify access token`);
        
        return reply(expectationFailed("Could not save Shopify access token."));
    }
    
    // Update the user's auth token
    setAuthCookie(request, user);
    
    return reply.redirect("/");
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
    
    setAuthCookie(request, user);
    
    return reply.redirect("/");
}