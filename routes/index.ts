import { Schema, validate } from "joi";
import { decode, encode } from "jwt-simple";
import { badData, unauthorized } from "boom";
import { resolve, promisify } from "bluebird";
import { seal, unseal, Defaults as IronDefaults } from "iron";
import { Express, Request, Response, NextFunction } from "express";
import { AUTH_HEADER_NAME, JWT_SECRET_KEY, IRON_PASSWORD } from "../modules/constants";
import { RouterResponse, RouterFunction, RouterRequest, User, SessionToken, WithSessionTokenFunction } from "gearworks";

// Promisify functions
const sealAsync = promisify(seal);
const unsealAsync = promisify(unseal);

// Import routes to register
import registerAccounts from "./accounts";
import registerSessions from "./sessions";
import registerWebhooks from "./webhooks";

const routeRegisters = [
    registerAccounts,
    registerSessions,
    registerWebhooks,
]

export default async function registerAllRoutes(app: Express) {
    // Custom functions for Express request and response objects
    const withSessionToken: WithSessionTokenFunction = async function (this: RouterResponse, user: User, expInDays = 30) {
        // Encrypt any sensitive properties (access tokens, api keys, etc.) with Iron.
        const sealedToken = await sealAsync(user.shopify_access_token, IRON_PASSWORD, IronDefaults);

        // exp: Part of the jwt spec, specifies an expiration date for the token.
        const exp = Date.now() + (expInDays * 24 * 60 * 60 * 1000);
        const session: SessionToken = Object.assign({}, user, { exp, shopify_access_token: sealedToken });

        return this.json({ token: encode(session, JWT_SECRET_KEY) }) as RouterResponse;
    };

    // Shim the app.response and app.request objects with our custom functions
    app.response["withSessionToken"] = withSessionToken;

    // A custom routing function that handles authentication and body/query/param validation
    const route: RouterFunction = (config) => {
        app[config.method.toLowerCase()](config.path, function (req: RouterRequest, res: RouterResponse, next: NextFunction) {
            if (config.requireAuth) {
                const header = req.header(AUTH_HEADER_NAME);
                let user: any;

                try {
                    user = decode(header, JWT_SECRET_KEY);
                } catch (e) {
                    return next(unauthorized(`Missing or invalid ${AUTH_HEADER_NAME} header.`));
                }

                // TODO: Decrypt any sensitive Iron-sealed properties.

                req.user = user;
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

            // Pass control to the route's handler. Handlers can be async, so wrap them in a bluebird resolve which can catch unhandled promise rejections.
            resolve(config.handler(req, res, next)).catch(e => {
                return next(e);
            });
        });
    }

    routeRegisters.forEach(f => f(app, route));
}