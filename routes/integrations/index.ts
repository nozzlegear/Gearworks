import * as joi from "joi";
import * as boom from "boom";
import { Express } from "express";
import { users } from "../../modules/database";
import { RouterFunction, User } from "gearworks";
import { Auth, Shops, Webhooks } from "shopify-prime";
import { DEFAULT_SCOPES, SHOPIFY_API_KEY, SHOPIFY_SECRET_KEY, ISLIVE } from "../../modules/constants";

export const BASE_PATH = "/api/v1/integrations/";

export const PATH_REGEX = /\/api\/v1\/integrations*?/i;

export default function registerRoutes(app: Express, route: RouterFunction) {
    route({
        method: "get",
        path: BASE_PATH + "shopify/url",
        requireAuth: true,
        queryValidation: joi.object({
            shop_domain: joi.string().required()
        }),
        handler: async function (req, res, next) {
            const url = await Auth.buildAuthorizationUrl(DEFAULT_SCOPES, req.validatedQuery.shop_domain, SHOPIFY_API_KEY);

            res.json({ url });

            return next();
        }
    });

    route({
        method: "post",
        path: BASE_PATH + "shopify",
        requireAuth: true,
        bodyValidation: joi.object({
            code: joi.string().required(),
            shop: joi.string().required(),
            hmac: joi.string().required(),
            state: joi.string()
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { code: string, shop: string, hmac: string, state?: string };
            let user: User;

            try {
                user = await users.get(req.user._id);
            } catch (e) {
                console.error(`Error getting user ${req.user._id} from database.`, e);

                return next(e);
            }

            const accessToken = await Auth.authorize(model.code, model.shop, SHOPIFY_API_KEY, SHOPIFY_SECRET_KEY);

            // Store the user's shop data
            user.shopify_domain = model.shop;
            user.shopify_access_token = accessToken;
            user.permissions = DEFAULT_SCOPES;

            try {
                const shop = await new Shops(model.shop, accessToken).get({ fields: "name,id" });

                user.shopify_shop_name = shop.name;
                user.shopify_shop_id = shop.id;
            } catch (e) {
                console.error(`Failed to get shop data from ${model.shop}`, e);
            }

            try {
                user = await users.put(user);
            } catch (e) {
                console.error(`Failed to update user ${user._id}'s Shopify access token`, e);

                return next(e);
            }

            await res.withSessionToken(user);

            // Don't create any webhooks unless this app is running on a real domain. Webhooks cannot point to localhost.
            if (ISLIVE) {
                // Create the AppUninstalled webhook immediately after the user accepts installation
                const webhooks = new Webhooks(model.shop, accessToken);
                const existingHooks = await webhooks.list({ topic: "app/uninstalled", fields: "id", limit: 1 });

                // Ensure the webhook doesn't already exist
                if (existingHooks.length === 0) {
                    const hook = await webhooks.create({
                        address: `${req.domainWithProtocol}/api/v1/webhooks/app-uninstalled?shop_id=${user.shopify_shop_id}`,
                        topic: "app/uninstalled"
                    })
                }
            }

            return next();
        }
    })
}