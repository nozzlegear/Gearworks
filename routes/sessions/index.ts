import * as boom from 'boom';
import * as Cache from 'gearworks-cache';
import * as gwv from 'gearworks-validation';
import * as Requests from "gearworks/requests/sessions";
import inspect from 'logspect';
import { CACHE_SEGMENT_AUTH } from '../../modules/constants';
import { compareSync } from 'bcryptjs';
import { Express } from 'express';
import { RouterFunction } from 'gearworks-route/bin';
import { User } from 'gearworks';
import { UserDb } from '../../modules/database';

export const BASE_PATH = "/api/v1/sessions/";

export const PATH_REGEX = /\/api\/v1\/sessions*?/i;

export default function registerRoutes(app: Express, route: RouterFunction<User>) {
    route({
        method: "post",
        path: BASE_PATH,
        requireAuth: false,
        bodyValidation: gwv.object<Requests.CreateSession>({
            username: gwv.string().required(),
            password: gwv.string().required(),
        }),
        handler: async function (req, res, next) {
            const model: Requests.CreateSession = req.validatedBody;
            let user: User;

            try {
                user = await UserDb.get(model.username.toLowerCase());
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
                await Cache.deleteValue(CACHE_SEGMENT_AUTH, user._id);
            } catch (e) {
                inspect(`Failed to remove user ${user._id} from auth-invalidation cache.`, e);                
            }

            res = await res.withSessionToken(user);

            return next();
        }
    });
}