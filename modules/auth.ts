/// <reference path="./../typings/typings.d.ts" />

import * as boom from "boom";
import * as bcrypt from "bcrypt";
import {Request} from "hapi";
import {v4 as guid} from "node-uuid";
import {isAuthenticRequest} from "shopify-prime";
import {Server, DefaultContext, User, AuthArtifacts, AuthCredentials} from "gearworks";

export const cookieName = "GearworksAuth"; 
export const fullStrategyName = "full-auth";
export const basicStrategyName = "basic-auth";
export const shopifyRequestStrategyName = "shopify-request-auth";
export const yarSalt: string = process.env.yarSalt;
export const encryptionSignature = process.env.encryptionSignature;

export type authCookie = {
    userId: string;
    username: string;
    encryptionSignature: string;
    shopName: string;
    shopDomain: string;
    shopToken: string;
    planId: string;
}

export function configureAuth(server: Server)
{
    //Configure a preresponse handler that will add the user's auth information to all view contexts
    server.ext("onPreResponse", (request, reply) =>
    {
        if (request.response.variety === "view")
        {
            const cookie: authCookie = request.yar.get(cookieName, false);
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
    
    const fullSchemeName = "full";
    const basicSchemeName = "basic";
    const shopifyRequestSchemeName = "shopify-request";
    
    server.auth.scheme(shopifyRequestSchemeName, (server, options) =>
    {
        return {
            authenticate: async (request, reply) =>
            {
                const isAuthentic = await isAuthenticRequest(request.query, server.app.shopifySecretKey);

                if (!isAuthentic)
                {
                    return reply(boom.badRequest("Request did not pass validation."));
                }
                
                return reply.continue(request.auth.credentials);
            }
        }
    });
    
    server.auth.scheme(basicSchemeName, (server, options) =>
    {
        return {
            authenticate: (request, reply) =>
            {
                const cookie = getAuthCookie(request);
                
                if (!cookie)
                {
                    const response = request.generateResponse().redirect("/auth/login");
                    
                    // Response is ignored if error is passed in as first param
                    return reply(null, response);
                }
                
                const result = getAuthCookieData(cookie);
                
                return reply.continue(result);
            }
        }
    })
    
    server.auth.scheme(fullSchemeName, (server, options) =>
    {
        return {
            authenticate: (request, reply) => 
            {
                const cookie = getAuthCookie(request);
                
                if (!cookie)
                {
                    const response = request.generateResponse().redirect("/auth/login");
                    
                    // Response is ignored if error is passed in as first param
                    return reply(null, response);
                }
                
                const result = getAuthCookieData(cookie);
                
                if (!result.artifacts.shopToken)
                {
                    const response = request.generateResponse().redirect("/setup");
                    
                    return reply(null, response, result);
                }
                
                if (!result.artifacts.planId)
                {
                    const response = request.generateResponse().redirect("/setup/plans");
                    
                    return reply(null, response, result);
                }
                
                return reply.continue(result);
            }
        }
    })
    
    server.auth.strategy(basicStrategyName, basicSchemeName, false);
    server.auth.strategy(shopifyRequestStrategyName, shopifyRequestSchemeName, false);
    server.auth.strategy(fullStrategyName, fullSchemeName, true /* Default strategy for all requests */);
}

export function getAuthCookieData(cookie: authCookie)
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
    const cookie: authCookie = request.yar.get(cookieName, false);
    
    if (!cookie || ! bcrypt.compareSync(encryptionSignature, cookie.encryptionSignature))
    {
        return undefined;
    }
    
    return cookie as authCookie;
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
    } as authCookie)
}