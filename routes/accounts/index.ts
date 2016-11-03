import * as joi from "joi";
import * as boom from "boom";
import { Express } from "express";
import { hashSync } from "bcryptjs";
import Plans from "./../../modules/plans";
import { RouterFunction } from "gearworks";
import { users } from "./../../modules/database"

export const BASE_PATH = "/api/v1/accounts/";

export const PATH_REGEX = /\/api\/v1\/accounts*?/i;

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
            const user = await users.post({
                _id: model.username,
                hashed_password: hashSync(model.password), 
            });

            res = await res.withSessionToken(user);

            return next();
        }
    });

    route({
        method: "put",
        path: BASE_PATH + ":id",
        requireAuth: true,
        bodyValidation: joi.object({
            username: joi.any().strip(),
            password: joi.any().strip(),
            plan: joi.string().only(Plans.map(p => p.id))
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { plan: string };

            return next(boom.notImplemented());
        }
    })
}