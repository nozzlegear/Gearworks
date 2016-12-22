import * as cors from "cors";
import inspect from "logspect";
import { Auth } from "shopify-prime";
import * as Bluebird from "bluebird";
import { Schema, validate } from "joi";
import { decode, encode } from "jwt-simple";
import { getCacheValue } from "../modules/cache";
import { seal, unseal } from "../modules/encryption";
import { badData, unauthorized, forbidden } from "boom";
import { Express, Request, Response, NextFunction } from "express";
import { json as parseJson, urlencoded as parseUrlEncoded } from "body-parser";
import { AUTH_HEADER_NAME, JWT_SECRET_KEY, SEALABLE_USER_PROPERTIES, SHOPIFY_SECRET_KEY } from "../modules/constants";
import { RouterResponse, RouterFunction, RouterRequest, User, SessionToken, WithSessionTokenFunction } from "gearworks";

// Temporary imports
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Import routes to register
import registerAccounts from "./accounts";
import registerSessions from "./sessions";
import registerWebhooks from "./webhooks";
import registerIntegrations from "./integrations";

const routeRegisters = [
    registerAccounts,
    registerSessions,
    registerWebhooks,
    registerIntegrations,
]

export default async function registerAllRoutes(app: Express) {
    // Custom functions for Express request and response objects
    const withSessionToken: WithSessionTokenFunction = async function (this: RouterResponse, user: User, expInDays = 30) {
        // Encrypt any sensitive properties (access tokens, api keys, etc.) with Iron.
        const sealedProps = await Bluebird.reduce(SEALABLE_USER_PROPERTIES, async (result, propName) => {
            if (!!user[propName]) {
                try {
                    result[propName] = await seal(user[propName]);
                } catch (e) {
                    inspect(`Failed to encrypt Iron-sealed property ${propName}. Removing property from resulting session token object.`, e);

                    // Prevent sending the unencrypted value to the client.
                    result[propName] = undefined;
                }
            }

            return result;
        }, {});

        // exp: Part of the jwt spec, specifies an expiration date for the token.
        const exp = Date.now() + (expInDays * 24 * 60 * 60 * 1000);
        const session: SessionToken = Object.assign({}, user, { exp }, sealedProps);

        return this.json({ token: encode(session, JWT_SECRET_KEY) }) as RouterResponse;
    };

    // Shim the app.response and app.request objects with our custom functions
    app.response["withSessionToken"] = withSessionToken;

    // A custom routing function that handles authentication and body/query/param validation
    const route: RouterFunction = (config) => {
        const method = config.method.toLowerCase();
        const corsMiddleware = config.cors ? cors() : (req, res, next) => next();
        let jsonParserMiddleware = (req, res, next) => next();
        let formParserMiddleware = (req, res, next) => next();

        if (config.cors && config.method !== "all") {
            // Add an OPTIONS request handler for the path. All non-trivial CORS requests from browsers 
            // send an OPTIONS preflight request.
            app.options(config.path, cors());
        }

        // Webhook validation must read the body exactly as its sent by Shopify, which is impossible when using parser middleware.
        // If the route requires validation a Shopify webhook, we'll skip parser middleware and parse it ourselves.
        if (!config.validateShopifyWebhook) {
            // Set up request body parsers
            jsonParserMiddleware = parseJson();
            formParserMiddleware = parseUrlEncoded({ extended: true });
        }
        
        app[method](config.path, corsMiddleware, jsonParserMiddleware, formParserMiddleware, async function (req: RouterRequest, res: RouterResponse, next: NextFunction) {
            req.domainWithProtocol = `${req.protocol}://${req.hostname}` + (req.hostname === "localhost" ? ":3000" : "");

            if (config.requireAuth) {
                const header = req.header(AUTH_HEADER_NAME);
                let user: User;

                try {
                    user = decode(header, JWT_SECRET_KEY);
                } catch (e) {
                    return next(unauthorized(`Missing or invalid ${AUTH_HEADER_NAME} header.`));
                }

                // If user id exists in invalidation cache, return a 401 unauthed response.
                try {
                    const cacheValue = await getCacheValue("auth-invalidation", user._id);

                    if (!!cacheValue) {
                        return next(unauthorized(`Server cache indicates that user must reauthenticate.`));
                    }
                } catch (e) {
                    inspect(`Error attempting to retrieve ${user._id} value from auth-invalidation cache.`, e);
                }

                // Decrypt sensitive Iron-sealed properties
                const unsealedProps = await Bluebird.reduce(SEALABLE_USER_PROPERTIES, async (result, propName) => {
                    if (!!user[propName]) {
                        try {
                            result[propName] = await unseal(user[propName]);
                        } catch (e) {
                            inspect(`Failed to decrypt Iron-sealed property ${propName}.`, e);
                        }
                    }

                    return result;
                }, {});

                req.user = Object.assign(user, unsealedProps);
            };

            if (config.bodyValidation) {
                const validation = validate(req.body, config.bodyValidation);

                if (validation.error) {
                    const error = badData(validation.error.message, validation.error.details);

                    return next(error);
                }

                req.validatedBody = validation.value;
            }

            if (config.queryValidation) {
                const validation = validate(req.query, config.queryValidation);

                if (validation.error) {
                    const error = badData(validation.error.message, validation.error.details);

                    return next(error);
                }

                req.validatedQuery = validation.value;
            }

            if (config.paramValidation) {
                const validation = validate(req.params, config.paramValidation);

                if (validation.error) {
                    const error = badData(validation.error.message, validation.error.details);

                    return next(error);
                }

                req.validatedParams = validation.value;
            }

            if (config.validateShopifyRequest) {
                const isValid = await Auth.isAuthenticRequest(req.query, SHOPIFY_SECRET_KEY);

                if (!isValid) {
                    const error = forbidden("Request does not pass Shopify's request validation scheme.");

                    return next(error);
                }
            }

            if (config.validateShopifyWebhook) {
                // If the body is empty, there's no way to validate the webhook.
                if (req.headers['transfer-encoding'] === undefined && isNaN(req.headers['content-length'] as any)) {
                    const error = forbidden("Request does not pass Shopify's webhook validation scheme.");
                    inspect("Webhook body appears to be empty and cannot be validated. Headers:", req.headers);

                    return next(error);
                }

                // To validate a webhook request, we must read the raw body as it was sent by Shopify — not the parsed body.
                const rawBody = await new Bluebird<string>((res, rej) => {
                    let body: string = "";

                    req.on("data", chunk => body += chunk);
                    req.on("end", () => res(body));
                })

                const isValid = await Auth.isAuthenticWebhook(req.headers, rawBody, SHOPIFY_SECRET_KEY);

                if (!isValid) {
                    const error = forbidden("Request does not pass Shopify's webhook validation scheme.")

                    return next(error);
                }

                if (req.header("content-type") === "application/json") {
                    req.body = JSON.parse(rawBody);
                }
            }

            if (config.validateShopifyProxyPage) {
                const isValid = await Auth.isAuthenticProxyRequest(req.query, SHOPIFY_SECRET_KEY);

                if (!isValid) {
                    const error = forbidden("Request does not pass Shopify's proxy page validation scheme.");

                    return next(error);
                }
            }

            // Pass control to the route's handler. Handlers can be async, so wrap them in a bluebird resolve which can catch unhandled promise rejections.
            Bluebird.resolve(config.handler(req, res, next)).catch(e => {
                return next(e);
            });
        });
    }

    routeRegisters.forEach(f => f(app, route));
}