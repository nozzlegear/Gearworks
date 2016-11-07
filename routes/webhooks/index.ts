import * as joi from "joi";
import * as boom from "boom";
import { Express } from "express";
import { RouterFunction, User } from "gearworks";
import { users } from "./../../modules/database";
import { deleteCacheValue } from "../../modules/cache";

export const BASE_PATH = "/api/v1/webhooks/";

export const PATH_REGEX = /\/api\/v1\/webhooks*?/i;

export default function registerRoutes(app: Express, route: RouterFunction) {
    route({
        path: BASE_PATH + "app-uninstalled",
        method: "post",
        requireAuth: false,
        handler: async function (req, res, next) {
            const query = req.query as { shop_id: string, shop: string };
            const userSearch = await users.find({
                selector: {
                    shopify_shop_id: parseInt(query.shop_id)
                } as User
            });

            if (userSearch.length === 0) {
                console.log(`Could not find owner of shop id ${query.shop} during app/uninstalled webhook.`);

                // No user found with that shopId. This webhook may be a duplicate. Return OK to prevent Shopify resending the webhook.
                res.status(200);

                return next();
            }

            const user = userSearch[0];

            // Shopify access token has already been invalidated at this point. Remove the user's Shopify data.
            user.shopify_access_token = undefined;
            user.shopify_domain = undefined;
            user.shopify_shop_id = undefined;
            user.shopify_shop_name = undefined;

            const update = await users.put(user, user._rev);

            // Delete the user's data from the auth cache to force their next request to query the database.
            try {
                await deleteCacheValue("users", user._id);
            }
            catch (e) {
                console.error("Failed to delete user data from auth cache after handling app/uninstalled webhook.", e);
            }

            res.status(200);

            return next();
        }
    })
}