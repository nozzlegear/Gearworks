import * as boom from 'boom';
import * as Cache from 'gearworks-cache';
import * as gwv from 'gearworks-validation';
import * as Requests from 'app/requests/sessions';
import inspect from 'logspect';
import Paths from '../../shared/paths';
import { CACHE_SEGMENT_AUTH } from '../../shared/constants';
import { compareSync } from 'bcryptjs';
import { Express } from 'express';
import { RouterFunction } from 'gearworks-route/bin';
import { User } from 'app';
import { UserDb } from '../database';

export function registerSessionRoutes(app: Express, route: RouterFunction<User>) {
    route({
        method: "post",
        path: Paths.api.sessions.base,
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