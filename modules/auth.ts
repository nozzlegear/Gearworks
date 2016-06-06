/// <reference path="./../typings/typings.d.ts" />

import * as boom from "boom";
import * as bcrypt from "bcrypt";
import {Request} from "hapi";
import {v4 as guid} from "node-uuid";
import {Routes as AuthRoutes} from "../routes/auth/auth-routes";
import {Routes as SetupRoutes} from "../routes/setup/setup-routes";
import {isAuthenticRequest, isAuthenticWebhook} from "shopify-prime";
import {Caches, getCacheValue, setCacheValue, deleteCacheValue} from "./cache";
import {Server, DefaultContext, User, AuthArtifacts, AuthCredentials, AuthCookie} from "gearworks";

export const cookieName = "GearworksAuth"; 
export const yarSalt: string = process.env.yarSalt;
export const encryptionSignature = process.env.encryptionSignature;

export const strategies = {
    fullAuth: "full-auth",
    basicAuth: "basic-auth",
    shopifyRequest: "shopify-request",
    shopifyWebhook: "shopify-webhook-auth",
}

export function configureAuth(server: Server)
{
    //Configure a preresponse handler that will add the user's auth information to all view contexts
    server.ext("onPreResponse", (request, reply) =>
    {
        if (request.response.variety === "view")
        {
            const cookie: AuthCookie = request.yar.get(cookieName, false);
            let context: DefaultContext = request.response.source.context;
            
            context.user = {
                isAuthenticated: !!cookie,
                userId: undefined,
                username: undefined,
            }
            
            if (cookie)
            {
                context.user.userId = cookie.userId; 
                context.user.username = cookie.username;
            }
        }
        
        return reply.continue();
    })
    
    const fullScheme = "full";
    const basicScheme = "basic";
    const shopifyRequestScheme = "shopify-request";
    const shopifyWebhookScheme = "shopify-webhook";
    
    server.auth.scheme(fullScheme, (s, options) => ({
        authenticate: (request, reply) => 
        {
            const cookie = getAuthCookie(request);
            
            if (!cookie)
            {
                const response = request.generateResponse().redirect(AuthRoutes.GetLogin);
                
                // Response is ignored if error is passed in as first param
                return reply(null, response);
            }
            
            const result = getAuthCookieData(cookie);
            
            if (!result.artifacts.shopToken)
            {
                const response = request.generateResponse().redirect(SetupRoutes.GetSetup);
                
                return reply(null, response, result);
            }
            
            if (!result.artifacts.planId)
            {
                const response = request.generateResponse().redirect(SetupRoutes.GetPlans);
                
                return reply(null, response, result);
            }
            
            return reply.continue(result);
        }
    }));
    
    server.auth.scheme(basicScheme, (s, options) => ({
        authenticate: async (request, reply) =>
        {
            const cookie = getAuthCookie(request);
            function generateRedirect()
            {
                return request.generateResponse().redirect(AuthRoutes.GetLogin);
            }
            
            if (!cookie)
            {
                // Response is ignored if error is passed in as first param
                return reply(null, generateRedirect());
            }
            
            const result = getAuthCookieData(cookie);
            let invalidationRequest: any;
            
            try
            {
                invalidationRequest = await getCacheValue(Caches.sessionInvalidation, result.credentials.userId);
            }
            catch (e)
            {
                console.log("Error getting cache value", e);
               
                // Not forcing user to login after cache retrieval error. Else they may easily get stuck on the login page.
            }
            
            if (invalidationRequest)
            {
                // User's login has been invalidated. Force them to log in again.
                return reply(null, generateRedirect())
            }
            
            return reply.continue(result);
        }
    }));
    
    server.auth.scheme(shopifyRequestScheme, (s, options) => ({
        authenticate: async (request, reply) =>
        {
            const isAuthentic = await isAuthenticRequest(request.query, server.app.shopifySecretKey);

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
            const isAuthentic = await isAuthenticWebhook(request.query, request.payload.rawBody, server.app.shopifySecretKey);
            
            if (!isAuthentic)
            {
                return reply(boom.badRequest("Request did not pass validation."));
            }
            
            return reply.continue(request.auth.credentials);
        }
    }))
    
    server.auth.strategy(strategies.basicAuth, basicScheme, false);
    server.auth.strategy(strategies.shopifyRequest, shopifyRequestScheme, false);
    server.auth.strategy(strategies.shopifyWebhook, shopifyWebhookScheme, false);
    server.auth.strategy(strategies.fullAuth, fullScheme, true /* Default strategy for all requests */);
}

function getAuthCookieData(cookie: AuthCookie)
{
    const result = {
        credentials: {
            username: cookie.username,
            userId: cookie.userId,
        } as AuthCredentials,
        artifacts: {
            shopName: cookie.shopName,
            shopDomain: cookie.shopDomain,
            shopToken: cookie.shopToken,
            planId: cookie.planId,
        } as AuthArtifacts,
    };
    
    return result;
}

/**
 * Attempts to get the user's auth cookie, ensuring it has a matching encryption signature. 
 * Returns undefined if the cookie isn't found or doesn't have a matching signature.
 */
export function getAuthCookie(request: Request)
{
    const cookie: AuthCookie = request.yar.get(cookieName, false);
    
    if (!cookie || ! bcrypt.compareSync(encryptionSignature, cookie.encryptionSignature))
    {
        return undefined;
    }
    
    return cookie as AuthCookie;
}

/**
 * Sets an auth cookie, e.g. after logging in or updating an auth cookie property.
 */
export function setAuthCookie(request: Request, user: User)
{
    const hash = bcrypt.hashSync(encryptionSignature, 10);
    
    return request.yar.set(cookieName, {
        encryptionSignature: hash,
        userId: user._id,
        username: user.username,
        shopDomain: user.shopifyDomain,
        shopName: user.shopifyShop,
        shopToken: user.shopifyAccessToken,
        planId: user.planId,
    } as AuthCookie)
}