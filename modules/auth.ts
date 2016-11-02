/// <reference path="./../typings/typings.d.ts" />

import * as boom from "boom";
import * as bcrypt from "bcrypt";
import {Users} from "./database";
import {v4 as guid} from "node-uuid";
import {getRawBody} from "./requests";
import {ShopifySecretKey, EncryptionSignature} from "./config";
import {Routes as AuthRoutes} from "../routes/auth/auth-routes";
import {Routes as SetupRoutes} from "../routes/setup/setup-routes";
import {isAuthenticRequest, isAuthenticWebhook} from "shopify-prime";
import {Caches, getCacheValue, setCacheValue, deleteCacheValue} from "./cache";
import {Server, DefaultContext, Request, User, AuthArtifacts, AuthCredentials, AuthCookie} from "gearworks";

export const cookieName = "GearworksAuth"; 
export const strategies = {
    fullAuth: "full-auth",
    basicAuth: "basic-auth",
    shopifyRequest: "shopify-request",
    shopifyWebhook: "shopify-webhook-auth",
}

export function configureAuth(server: Server)
{
    //Configure a preresponse handler that will add the user's auth information to all view contexts
    server.ext("onPreResponse", (request: Request, reply) =>
    {
        if (request.response.variety === "view")
        {
            const context: DefaultContext = request.response.source.context || {};
            
            context.user = {
                isAuthenticated: request.auth.isAuthenticated,
                userId: undefined,
                username: undefined,
            }
            
            if (request.auth.isAuthenticated)
            {
                context.user.userId = request.auth.credentials.userId; 
                context.user.username = request.auth.credentials.username;
            }
        }
        
        return reply.continue();
    })
    
    const fullScheme = "full";
    const basicScheme = "basic";
    const shopifyRequestScheme = "shopify-request";
    const shopifyWebhookScheme = "shopify-webhook";
    
    server.auth.scheme(fullScheme, (s, options) => ({
        authenticate: async (request, reply) => 
        {
            function unauthorized()
            {
                const response = request.generateResponse().redirect(AuthRoutes.GetLogin);
                

                // Response is ignored if error is passed in as first param
                return reply(null, response);
            }

            let auth: {credentials: AuthCredentials; artifacts: AuthArtifacts};

            try
            {
                auth = await getUserAuth(request);
            }
            catch (e)
            {
                if (e.status === 404)
                {
                    return unauthorized();
                }

                return reply(boom.wrap(e));
            }

            if (!auth)
            {
                return unauthorized();
            }
            
            if (!auth.artifacts.shopToken)
            {
                const response = request.generateResponse().redirect(SetupRoutes.GetSetup);
                
                return reply(null, response, auth);
            }
            
            if (!auth.artifacts.planId)
            {
                const response = request.generateResponse().redirect(SetupRoutes.GetPlans);
                
                return reply(null, response, auth);
            }
            
            return reply.continue(auth);
        }
    }));
    
    server.auth.scheme(basicScheme, (s, options) => ({
        authenticate: async (request, reply) =>
        {
            function unauthorized()
            {
                const response = request.generateResponse().redirect(AuthRoutes.GetLogin);
                

                // Response is ignored if error is passed in as first param
                return reply(null, response);
            }

            let auth: {credentials: AuthCredentials; artifacts: AuthArtifacts};

            try
            {
                auth = await getUserAuth(request);
            }
            catch (e)
            {
                if (e.status === 404)
                {
                    return unauthorized();
                }

                return reply(boom.wrap(e));
            }

            if (!auth)
            {
                return unauthorized();
            }
            
            return reply.continue(auth);
        }
    }));
    
    server.auth.scheme(shopifyRequestScheme, (s, options) => ({
        authenticate: async (request, reply) =>
        {
            let isAuthentic: boolean;

            try
            {
                isAuthentic = await isAuthenticRequest(request.query, ShopifySecretKey);
            }
            catch (e)
            {
                return reply(boom.wrap(e));
            }

            if (!isAuthentic)
            {
                return reply(boom.badRequest("Request did not pass validation."));
            }
            
            return reply.continue(request.auth.credentials);
        }
    }));
    
    server.auth.scheme(shopifyWebhookScheme, (s, options) => ({
        authenticate: async (request, reply) =>
        {
            let body: string;
            let isAuthentic: boolean;

            try
            {
                body = await getRawBody(request);
            }
            catch (e)
            {
                return boom.wrap(e);
            }
            
            try
            {
                isAuthentic = await isAuthenticWebhook(request.headers["x-shopify-hmac-sha256"], body, ShopifySecretKey);
            }
            catch (e)
            {
                console.log("Failed to get isAuthentic result", e);

                return reply(boom.badRequest("Failed to get isAuthentic result.", e));
            }
            
            if (!isAuthentic)
            {
                return reply(boom.unauthorized("Request did not pass validation."));
            }
            
            return reply.continue({credentials: {}});
        },
    }))
    
    server.auth.strategy(strategies.basicAuth, basicScheme, false);
    server.auth.strategy(strategies.shopifyRequest, shopifyRequestScheme, false);
    server.auth.strategy(strategies.shopifyWebhook, shopifyWebhookScheme, false);
    server.auth.strategy(strategies.fullAuth, fullScheme, true /* Default strategy for all requests */);
}

/**
 * Attempts to get the user's auth cookie, ensuring it has a matching encryption signature. 
 * Returns undefined if the cookie isn't found or doesn't have a matching signature.
 */
export function getUserAuth(request: Request)
{
    const cookie: AuthCookie = request.yar.get(cookieName, false);
    
    if (!cookie || ! bcrypt.compareSync(EncryptionSignature, cookie.encryptionSignature))
    {
        return undefined;
    }
    
    return getAuthData(cookie);
}

/**
 * Sets an auth cookie and caching data, e.g. after logging in or updating a user.
 */
export async function setUserAuth(request: Request, user: User)
{
    const hash = bcrypt.hashSync(EncryptionSignature, 10);
    const cookie: AuthCookie = {
        encryptionSignature: hash,
        userId: user._id.toLowerCase(),
        username: user.username,
    }

    try
    {
        await setUserCache(user);
    }
    catch (e)
    {
        console.error("Error setting user cache data.");

        throw e;
    }
    
    return request.yar.set(cookieName, cookie);
}

async function getAuthData(cookie: AuthCookie, autoRefreshCache?: boolean): Promise<{artifacts: AuthArtifacts; credentials: AuthCredentials}>
{
    // Auto refresh cache by default
    if (typeof autoRefreshCache === "undefined")
    {
        autoRefreshCache = true;
    }

    const credentials: AuthCredentials = {
        username: cookie.username,
        userId: cookie.userId,
    };
    const session = await getUserCache(cookie.userId, autoRefreshCache);

    if (!session)
    {
        //Session can be null when user data wasn't found in the cache *or* the database.
        
        return undefined;
    }

    const result = {
        artifacts: session,
        credentials: credentials,
    };
    
    return result;
}

async function setUserCache(user: User)
{
    const result: AuthArtifacts = {
        planId: user.planId,
        shopName: user.shopifyShopName,
        shopDomain: user.shopifyDomain,
        shopToken: user.shopifyAccessToken,
        shopId: user.shopifyShopId,
        chargeId: user.chargeId,
    };

    await setCacheValue(Caches.userAuth, user._id, result);

    return result;
}

/**
 * Gets user data from the cache.
 */
async function getUserCache(userId: string, autoRefreshCache: boolean): Promise<AuthArtifacts>
{
    const result = await getCacheValue<AuthArtifacts>(Caches.userAuth, userId);

    if (!result && autoRefreshCache)
    {
        // Attempt to pull auth data from database.
        const user = await Users.get<User>(userId.toLowerCase());
        const data: AuthArtifacts = {
            planId: user.planId,
            shopDomain: user.shopifyDomain, 
            shopName: user.shopifyShopName,
            shopToken: user.shopifyAccessToken,
            shopId: user.shopifyShopId,
            chargeId: user.chargeId,
        };

        // Store this data back in the cache to prevent future db queries
        await setCacheValue(Caches.userAuth, userId, data);

        return data;
    }
    else if (!result)
    {
        return undefined;
    }

    return result.item;
}