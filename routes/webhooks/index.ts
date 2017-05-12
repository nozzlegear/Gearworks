import * as boom from 'boom';
import * as Cache from 'gearworks-cache';
import * as joi from 'joi';
import inspect from 'logspect';
import { CACHE_SEGMENT_AUTH } from '../../modules/constants';
import { Express } from 'express';
import { RouterFunction } from 'gearworks-route/bin';
import { User } from 'gearworks';
import { UserDb } from '../../modules/database';

export const BASE_PATH = "/api/v1/webhooks/";

export const PATH_REGEX = /\/api\/v1\/webhooks*?/i;

export default function registerRoutes(app: Express, route: RouterFunction<User>) {
    route({
        path: BASE_PATH + "app-uninstalled",
        method: "all",
        requireAuth: false,
        validateShopifyWebhook: true,
        handler: async function (req, res, next) {
            const query = req.query as { shop_id: string, shop: string };
            const userSearch = await UserDb.find({
                selector: {
                    shopify_shop_id: parseInt(query.shop_id)
                } as User
            });

            if (userSearch.length === 0) {
                inspect(`Could not find owner of shop id ${query.shop_id} during app/uninstalled webhook. Returning true to prevent webhook retries.`);

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
            user.charge_id = undefined;
            user.plan_id = undefined;

            const update = await UserDb.put(user._id, user, user._rev);

            // Add the user's id to the auth-invalidation cache, forcing their next request to prompt them to login again.
            try {
                await Cache.setValue(CACHE_SEGMENT_AUTH, user._id, true, 21 * 1000 * 60 * 60 * 24 /* 21 days in milliseconds */);
            }
            catch (e) {
                inspect("Failed to delete user data from auth cache after handling app/uninstalled webhook.", e);
            }

            res.json({});

            return next();
        }
    })
}