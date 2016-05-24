/// <reference path="./../typings/typings.d.ts" />

import * as boom from "boom";
import * as bcrypt from "bcrypt";
import {Request} from "hapi";
import {v4 as guid} from "node-uuid";
import {Server, DefaultContext} from "gearworks";

export const schemeName = "cookie";
export const strategyName = "simple";
export const cookieName = "GearworksAuth"; 
export const yarSalt: string = process.env.yarSalt;
export const encryptionSignature = process.env.encryptionSignature;

export type authCookie = {
    userId: string | number;
    username: string;
    encryptionSignature: string;
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
    
    server.auth.scheme(schemeName, (server, options) =>
    {
        return {
            authenticate: (request, reply) => 
            {
                const cookie: authCookie = request.yar.get(cookieName, false);
                
                if (!cookie || ! bcrypt.compareSync(encryptionSignature, cookie.encryptionSignature))
                {
                    const response = request.generateResponse().redirect("/auth/login");
                    
                    // Response is ignored if error is passed in as first param
                    return reply(null, response);
                }
                
                let result = {
                    credentials: {
                        userId: cookie.userId,
                        username: cookie.username
                    }
                }
                
                return reply.continue(result);
            }
        }
    })
    
    const authenticateAllRoutes = true;
    
    server.auth.strategy(strategyName, schemeName, authenticateAllRoutes);
}

export function setAuthCookie(request: Request, userId: string | number, username: string)
{
    const hash = bcrypt.hashSync(encryptionSignature, 10);
    
    return request.yar.set(cookieName, {
        encryptionSignature: hash,
        userId: userId,
        username: username
    } as authCookie)
}