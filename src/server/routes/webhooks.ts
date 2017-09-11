import * as boom from 'boom';
import * as Cache from 'gearworks-cache';
import * as gwv from 'gearworks-validation';
import * as Requests from 'app/requests/webhooks';
import inspect from 'logspect';
import Paths from '../../shared/paths';
import { CACHE_SEGMENT_AUTH } from '../../shared/constants';
import { Express } from 'express';
import { RouterFunction } from 'gearworks-route/bin';
import { User } from 'app';
import { UserDb } from '../database';

export function registerWebhookRoutes(app: Express, route: RouterFunction<User>) {
    route({
        path: Paths.api.webhooks.base + "app-uninstalled",
        method: "all",
        requireAuth: false,
        validateShopifyWebhook: true,
        queryValidation: gwv.object<Requests.AppUninstalled>({
            shop_id: gwv.string(),
            shop: gwv.string(),
        }),
        handler: async function (req, res, next) {
            const query: Requests.AppUninstalled = req.query;
            const userSearch = await UserDb.find({
                selector: {
                    shopify_shop_id: {
                        $eq: parseInt(query.shop_id)
                    }
                }
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