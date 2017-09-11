import * as boom from 'boom';
import * as Constants from '../../shared/constants';
import * as gwv from 'gearworks-validation';
import * as Requests from 'app/requests/shopify';
import inspect from 'logspect';
import Paths from '../../shared/paths';
import {
    Auth,
    Models,
    Orders,
    ScriptTags,
    Shops,
    Webhooks
    } from 'shopify-prime';
import { Express } from 'express';
import { RouterFunction } from 'gearworks-route/bin';
import { User } from 'app';
import { UserDb } from '../database';

export function registerShopifyRoutes(app: Express, route: RouterFunction<User>) {
    route({
        method: "get",
        path: Paths.api.shopify.base + "url",
        requireAuth: true,
        queryValidation: gwv.object<Requests.GetOauthUrl>({
            shop_domain: gwv.string().required(),
            redirect_url: gwv.string().required(),
        }).unknown(true),
        handler: async function (req, res, next) {
            const query: Requests.GetOauthUrl = req.validatedQuery;
            const isValidUrl = await Auth.isValidShopifyDomain(req.validatedQuery.shop_domain);

            if (!isValidUrl) {
                return next(boom.notAcceptable(`${query.shop_domain} is not a valid Shopify shop domain.`));
            }

            const authUrl = await Auth.buildAuthorizationUrl(Constants.DEFAULT_SCOPES, req.validatedQuery.shop_domain, Constants.SHOPIFY_API_KEY, query.redirect_url);

            res.json({ url: authUrl });

            return next();
        }
    });

    route({
        method: "post",
        path: Paths.api.shopify.base + "authorize",
        requireAuth: true,
        validateShopifyRequest: true,
        bodyValidation: gwv.object<Requests.Authorize>({
            code: gwv.string().required(),
            shop: gwv.string().required(),
            hmac: gwv.string().required(),
            state: gwv.string()
        }).unknown(true),
        handler: async function (req, res, next) {
            const model: Requests.Authorize = req.validatedBody;
            let user: User;

            try {
                user = await UserDb.get(req.user._id);
            } catch (e) {
                inspect(`Error getting user ${req.user._id} from database.`, e);

                return next(e);
            }

            const accessToken = await Auth.authorize(model.code, model.shop, Constants.SHOPIFY_API_KEY, Constants.SHOPIFY_SECRET_KEY);

            // Store the user's shop data
            user.shopify_domain = model.shop;
            user.shopify_access_token = accessToken;
            user.permissions = Constants.DEFAULT_SCOPES;

            try {
                const shop = await new Shops(model.shop, accessToken).get({ fields: "name,id" });

                user.shopify_shop_name = shop.name;
                user.shopify_shop_id = shop.id;
            } catch (e) {
                inspect(`Failed to get shop data from ${model.shop}`, e);
            }

            try {
                const updateResult = await UserDb.put(user._id, user, user._rev);
                user._rev = updateResult.rev;
            } catch (e) {
                inspect(`Failed to update user ${user._id}'s Shopify access token`, e);

                return next(e);
            }

            await res.withSessionToken(user);

            // Don't create any webhooks unless this app is running on a real domain. Webhooks cannot point to localhost.
            if (Constants.ISLIVE) {
                // Create the AppUninstalled webhook immediately after the user accepts installation
                const webhooks = new Webhooks(model.shop, accessToken);
                const existingHooks = await webhooks.list({ topic: "app/uninstalled", fields: "id", limit: 1 });

                // Ensure the webhook doesn't already exist
                if (existingHooks.length === 0) {
                    const hook = await webhooks.create({
                        address: req.domainWithProtocol + Paths.api.webhooks.base + `app-uninstalled?shop_id=${user.shopify_shop_id}`,
                        topic: "app/uninstalled"
                    })
                }
            }

            return next();
        }
    })

    route({
        method: "get",
        path: Paths.api.shopify.base + "orders",
        requireAuth: true,
        queryValidation: gwv.object<Requests.ListOrders>({
            limit: gwv.number().default(50),
            page: gwv.gt(0).default(1),
            status: gwv.onlyStrings("any"),
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
        path: Paths.api.shopify.base + "orders",
        requireAuth: true,
        bodyValidation: gwv.object<Requests.CreateOrder>({
            city: gwv.string().required(),
            email: gwv.string().required(),
            line_item: gwv.string().required(),
            name: gwv.string().required(),
            quantity: gwv.number().required(),
            state: gwv.string().required(),
            street: gwv.string().required(),
            zip: gwv.string().required(),
        }),
        handler: async function (req, res, next) {
            const model: Requests.CreateOrder = req.validatedBody;
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
        path: Paths.api.shopify.base + "orders/:id/open",
        requireAuth: true,
        paramValidation: gwv.object<Requests.OpenCloseDelete>({
            id: gwv.number().required()
        }),
        handler: async function (req, res, next) {
            const params: Requests.OpenCloseDelete = req.validatedParams;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);
            const order = await service.open(params.id);

            res.json(order);

            return next();
        }
    })

    route({
        method: "post",
        path: Paths.api.shopify.base + "orders/:id/close",
        requireAuth: true,
        paramValidation: gwv.object<Requests.OpenCloseDelete>({
            id: gwv.number().required()
        }),
        handler: async function (req, res, next) {
            const params: Requests.OpenCloseDelete = req.validatedParams;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);
            const order = await service.close(params.id);

            res.json(order);

            return next();
        }
    })

    route({
        method: "delete",
        path: Paths.api.shopify.base + "orders/:id",
        requireAuth: true,
        paramValidation: gwv.object<Requests.OpenCloseDelete>({
            id: gwv.number().required()
        }),
        handler: async function (req, res, next) {
            const params: Requests.OpenCloseDelete = req.validatedParams;
            const service = new Orders(req.user.shopify_domain, req.user.shopify_access_token);

            await service.delete(params.id);

            res.json({});

            return next();
        }
    })
}