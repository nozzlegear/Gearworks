/// <reference path="./../../typings/index.d.ts" />

import {IReply} from "hapi";
import {Server, Request} from "gearworks";
import {strategies} from "../../modules/auth";

export const Routes = {
     GetAppUninstalled: "/webhooks/app-uninstalled",
}

export function registerRoutes(server: Server)
{
    server.route({
        method: "GET",
        path: Routes.GetAppUninstalled,
        config: {
            auth: strategies.shopifyWebhook
        },
        handler: {
            async: (request, reply) => handleAppUninstalled(server, request, reply)
        }
    })
}

export async function handleAppUninstalled(server: Server, request: Request, reply: IReply)
{
    // TODO: figure out how to invalidate a Yar cookie. Anybody trying to use the app after their 
    // shopify key was invalidated is going to have a bad time.
    
    // Each user should have a guid cache key, then when logging in that cache key gets stored in some
    // kind of session storage. A function will be created for invalidating a session, which just removes
    // that cache key from session storage. Every auth check will check that session for the cache storage 
    // in the yar cookie. If it doesn't exist there, the user will have to login again.
    
    // Or, a different session storage that just tracks users that need to log in again. This would likely
    // need to be backed by a db store in case the server shuts down before the user logs out. They should
    // have a max age of the same length as the yar cookie.
    
    
    return reply(null);
}