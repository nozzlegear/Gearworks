import * as joi from "joi";
import * as boom from "boom";
import { Express } from "express";
import { compareSync } from "bcryptjs";
import { users } from "./../../modules/database";
import { RouterFunction, User } from "gearworks";
import { deleteCacheValue } from "../../modules/cache";

export const BASE_PATH = "/api/v1/sessions/";

export const PATH_REGEX = /\/api\/v1\/sessions*?/i;

export default function registerRoutes(app: Express, route: RouterFunction) {
    route({
        method: "post",
        path: BASE_PATH,
        requireAuth: false,
        bodyValidation: joi.object({
            username: joi.string().required(),
            password: joi.string().required(),
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { username: string, password: string };
            let user: User;

            try {
                user = await users.get(model.username.toLowerCase());
            } catch (e) {
                const err: boom.BoomError = e;

                if (err.isBoom && err.output.statusCode !== 404) {
                    return next(e);
                }
            }

            if (!user || !compareSync(model.password, user.hashed_password)) {
                return next(boom.unauthorized("No user found with that username or password combination."));
            }

            // The user has logged in again, so we'll remove their user id from the auth-invalidation cache.
            try {
                await deleteCacheValue("auth-invalidation", user._id);
            } catch (e) {
                console.error(`Failed to remove user ${user._id} from auth-invalidation cache.`, e);                
            }

            res = await res.withSessionToken(user);

            return next();
        }
    });
}