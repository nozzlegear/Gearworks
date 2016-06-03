/// <reference path="./../../typings/index.d.ts" />

import {Request, IReply} from "hapi";
import {users} from "../../modules/database";
import {badRequest, expectationFailed} from "boom";
import {Server, AuthCredentials, User} from "gearworks";
import {isAuthenticRequest, authorize} from "shopify-prime";
import {basicStrategyName, setAuthCookie} from "../../modules/auth";

export function registerRoutes(server: Server)
{
    server.route({
        method: "GET",
        path: "/connect/shopify",
        config: {
            auth: basicStrategyName
        },
        handler: {
            async: (request, reply) => connectShopify(server, request, reply)
        }
    })
}

export async function connectShopify(server: Server, request: Request, reply: IReply): Promise<any>
{
    const credentials: AuthCredentials = request.auth.credentials;
    const query: {code: string, shop: string, hmac: string, localRedirect?: string} = request.query;
    const isAuthentic = isAuthenticRequest(query, server.app.shopifySecretKey);
    
    if (!isAuthentic)
    {
        return reply(badRequest("Request did not pass validation."));
    }
    
    const accessToken = await authorize(query.code, query.shop, server.app.shopifyApiKey, server.app.shopifySecretKey);
    
    // Grab the user model from the database to update it
    let user = await users.get(credentials.userId) as User;
    
    // TODO: Use Shopify Prime to get the shop name
    user.shopifyDomain = query.shop;
    user.shopifyAccessToken = accessToken;
    user.shopifyShop = "Your Shopify Shop";
    
    const response = await users.put(user);
    
    if (!response.ok)
    {
        console.error(`Failed to update user ${user._id}'s Shopify access token`);
        
        return reply(expectationFailed("Could not save Shopify access token."));
    }
    
    // Update the user's auth token
    setAuthCookie(request, user);
    
    //Figure out where to redirect the user
    const path = query.localRedirect || "/";
    
    return reply.redirect(path);
}