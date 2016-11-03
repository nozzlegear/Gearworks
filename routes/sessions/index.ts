import * as joi from "joi";
import * as boom from "boom";
import { Express } from "express";
import { compareSync } from "bcryptjs";
import { users } from "./../../modules/database"
import { RouterFunction, User } from "gearworks";

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
            const user = await users.get(model.username.toLowerCase());

            if (!user || ! compareSync(model.password, user.hashed_password)) {
                return next(boom.unauthorized("No user found with that username or password combination."));
            }

            res = await res.withSessionToken(user);

            return next();
        }
    });
}