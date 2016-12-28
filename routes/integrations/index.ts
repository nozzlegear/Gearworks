import * as qs from "qs";
import * as joi from "joi";
import * as boom from "boom";
import inspect from "logspect";
import { Express } from "express";
import { UserDb } from "../../modules/database";
import { RouterFunction, User } from "gearworks";
import { CreateOrderRequest } from "gearworks/requests";
import { BASE_PATH as WEBHOOKS_BASE_PATH } from "../webhooks";
import { Auth, Shops, Webhooks, Models, ScriptTags, Orders } from "shopify-prime";
import { DEFAULT_SCOPES, SHOPIFY_API_KEY, SHOPIFY_SECRET_KEY, ISLIVE, APP_NAME } from "../../modules/constants";

export const BASE_PATH = "/api/v1/integrations/";

export const PATH_REGEX = /\/api\/v1\/integrations*?/i;

export default function registerRoutes(app: Express, route: RouterFunction) {
    route({
        method: "get",
        path: BASE_PATH + "shopify/url",
        requireAuth: true,
        queryValidation: joi.object({
            shop_domain: joi.string().required(),
            redirect_url: joi.string().required(),
        }).unknown(true),
        handler: async function (req, res, next) {
            const url = req.validatedQuery.shop_domain;
            const redirect = req.validatedQuery.redirect_url;
            const isValidUrl = await Auth.isValidShopifyDomain(req.validatedQuery.shop_domain);

            if (!isValidUrl) {
                return next(boom.notAcceptable(`${url} is not a valid Shopify shop domain.`));
            }

            const authUrl = await Auth.buildAuthorizationUrl(DEFAULT_SCOPES, req.validatedQuery.shop_domain, SHOPIFY_API_KEY, redirect);

            res.json({ url: authUrl });

            return next();
        }
    });

    route({
        method: "post",
        path: BASE_PATH + "shopify/authorize",
        requireAuth: true,
        validateShopifyRequest: true,
        bodyValidation: joi.object({
            code: joi.string().required(),
            shop: joi.string().required(),
            hmac: joi.string().required(),
            state: joi.string()
        }).unknown(true),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { code: string, shop: string, hmac: string, state?: string };
            let user: User;

            try {
                user = await UserDb.get(req.user._id);
            } catch (e) {
                inspect(`Error getting user ${req.user._id} from database.`, e);

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
                inspect(`Failed to get shop data from ${model.shop}`, e);
            }

            try {
                user = await UserDb.put(user._id, user, user._rev);
            } catch (e) {
                inspect(`Failed to update user ${user._id}'s Shopify access token`, e);

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
                        address: req.domainWithProtocol + WEBHOOKS_BASE_PATH + `app-uninstalled?shop_id=${user.shopify_shop_id}`,
                        topic: "app/uninstalled"
                    })
                }
            }

            return next();
        }
    })

    route({
        method: "get",
        path: BASE_PATH + "shopify/orders",
        requireAuth: true,
        queryValidation: joi.object({
            limit: joi.number().default(50),
            page: joi.number().greater(0).default(1),
            status: joi.string().only("any").default("any"),
        }).unknown(true),
        handler: async function (req, res, next) {
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);
            const orders = await service.list(req.validatedQuery);

            res.json(orders);

            return next();
        }
    })

    route({
        method: "post",
        path: BASE_PATH + "shopify/orders",
        requireAuth: true,
        bodyValidation: joi.object({
            city: joi.string().required(),
            email: joi.string().required(),
            line_item: joi.string().required(),
            name: joi.string().required(),
            quantity: joi.number().required(),
            state: joi.string().required(),
            street: joi.string().required(),
            zip: joi.string().required(),
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as CreateOrderRequest;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);
            const order = await service.create({
                billing_address: {
                    address1: model.street,
                    city: model.city,
                    province: model.state,
                    zip: model.zip,
                    name: model.name,
                    country_code: "US",
                    default: true,
                },
                line_items: [
                    {
                        name: model.line_item,
                        title: model.line_item,
                        quantity: model.quantity,
                        price: 5,
                    },
                ],
                financial_status: "authorized",
                email: model.email,
            });

            res.json(order);

            return next();
        }
    })

    route({
        method: "post",
        path: BASE_PATH + "shopify/orders/:id/open",
        requireAuth: true,
        paramValidation: joi.object({
            id: joi.number().required()
        }),
        handler: async function (req, res, next) {
            const id = req.validatedParams.id as number;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);
            const order = await service.open(id);

            res.json(order);

            return next();
        }
    })

    route({
        method: "post",
        path: BASE_PATH + "shopify/orders/:id/close",
        requireAuth: true,
        paramValidation: joi.object({
            id: joi.number().required()
        }),
        handler: async function (req, res, next) {
            const id = req.validatedParams.id as number;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);
            const order = await service.close(id);

            res.json(order);

            return next();
        }
    })

    route({
        method: "delete",
        path: BASE_PATH + "shopify/orders/:id",
        requireAuth: true,
        paramValidation: joi.object({
            id: joi.number().required()
        }),
        handler: async function (req, res, next) {
            const id = req.validatedParams.id as number;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);

            await service.delete(id);

            res.json({});

            return next();
        }
    })
}