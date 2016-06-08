/// <reference path="./../../typings/index.d.ts" />

import {expectationFailed} from "boom";
import {Server, Request} from "gearworks";
import {IReply, IBoom, Response} from "hapi";
import {strategies} from "../../modules/auth";
import {deleteCacheValue, Caches} from "../../modules/cache";
import {findUserByShopId, Users} from "../../modules/database";

export const Routes = {
     GetAppUninstalled: "/webhooks/app-uninstalled",
}

export function registerRoutes(server: Server)
{
    server.route({
        method: "POST",
        path: Routes.GetAppUninstalled,
        config: {
            auth: strategies.shopifyWebhook
        },
        handler: {
            async: (request, reply) => handleAppUninstalled(server, request, reply)
        }
    })
}
 
export async function handleAppUninstalled(server: Server, request: Request, reply: IReply): Promise<IBoom | Response>
{
    const query: {shopId: string, shop: string} = request.query;
    const user = await findUserByShopId(parseInt(query.shopId));

    if (!user)
    {
        console.log(`Could not find owner of shop id ${query.shop} during app/uninstalled webhook.`);

        // No user found with that shopId. This webhook may be a duplicate. Return OK to prevent Shopify resending the webhook.
        return reply(null);
    }

    // Shopify access token has already been invalidated at this point. Remove the user's Shopify data.
    user.shopifyAccessToken = undefined;
    user.shopifyDomain = undefined;
    user.shopifyShopId = undefined;
    user.shopifyShopName = undefined;

    const update = await Users.put(user);

    if (!update.ok)
    {
        console.error(`Failed to delete user ${user._id}'s Shopify data during app/uninstalled webhook.`, update);

        return reply(expectationFailed("Failed to delete user's Shopify data during app/uninstalled webhook."));
    }

    // Delete the user's data from the auth cache to force their next request to query the database.
    try
    {
        await deleteCacheValue(Caches.userAuth, user._id);
    }
    catch (e)
    {
        console.error("Failed to delete user data from auth cache after handling app/uninstalled webhook.", e);
    }

    return reply(null);
}