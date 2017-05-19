import * as boom from 'boom';
import * as gwv from 'gearworks-validation';
import * as Requests from 'gearworks/requests/accounts';
import inspect from 'logspect';
import {
    APP_NAME,
    EMAIL_DOMAIN,
    IRON_PASSWORD,
    ISLIVE,
    SPARKPOST_API_KEY
    } from '../../modules/constants';
import { compareSync, hashSync } from 'bcryptjs';
import { createTransport } from 'nodemailer';
import { Express } from 'express';
import { Models, RecurringCharges } from 'shopify-prime';
import { RouterFunction } from 'gearworks-route/bin';
import { seal, unseal } from 'iron-async';
import { User } from 'gearworks';
import { UserDb } from './../../modules/database';

export const BASE_PATH = "/api/v1/accounts/";

export const PATH_REGEX = /\/api\/v1\/accounts*?/i;

interface ResetToken {
    exp: number;
    username: string;
}

export default function registerRoutes(app: Express, route: RouterFunction<User>) {
    route({
        method: "post",
        path: BASE_PATH,
        requireAuth: false,
        bodyValidation: gwv.object<Requests.CreateOrUpdateAccount>({
            username: gwv.string().email().required(),
            password: gwv.string().min(6).max(100).required(),
        }),
        handler: async function (req, res, next) {
            const model: Requests.CreateOrUpdateAccount = req.validatedBody;

            if (await UserDb.exists(model.username.toLowerCase())) {
                return next(boom.badData(`A user with that username already exists.`));
            }

            const user = await UserDb.post({
                _id: model.username.toLowerCase(),
                hashed_password: hashSync(model.password),
                date_created: new Date().toISOString(),
            });

            await res.withSessionToken(user);

            return next();
        }
    });

    route({
        method: "put",
        path: BASE_PATH + "username",
        requireAuth: true,
        bodyValidation: gwv.object<Requests.CreateOrUpdateAccount>({
            username: gwv.string().email().required(),
            password: gwv.string().required(),
        }),
        handler: async function (req, res, next) {
            const model: Requests.CreateOrUpdateAccount = req.validatedBody;

            if (await UserDb.exists(model.username.toLowerCase())) {
                return next(boom.badData(`A user with that username already exists.`));
            }

            let user = await UserDb.get(req.user._id);
            const {_id, _rev} = user;

            // Ensure the user's password is correct before changing their username
            if (!compareSync(model.password, user.hashed_password)) {
                return next(boom.forbidden(`Your password is incorrect.`));
            }

            try {
                // CouchDB does not allow modifying a doc's id, so we copy the user to a new document instead.
                const copyResult = await UserDb.copy(_id, model.username.toLowerCase());
                const user = await UserDb.get(copyResult.id);
            } catch (e) {
                inspect("Failed to copy user model to new id.", e);

                return next(boom.badData("Failed to save new user id."));
            }

            try {
                // Delete the old user document
                await UserDb.delete(_id, _rev);
            } catch (e) {
                inspect(`Failed to delete user doc ${_id} after changing username to ${model.username}`, e);
            }

            await res.withSessionToken(user);

            return next();
        }
    })

    route({
        method: "post",
        path: BASE_PATH + "password/forgot",
        requireAuth: false,
        bodyValidation: gwv.object<Requests.Username>({
            username: gwv.string().email().required()
        }),
        handler: async function (req, res, next) {
            const model: Requests.Username = req.validatedBody;
            let user: User;

            if (!UserDb.exists(model.username.toLowerCase())) {
                // Do not let the client know that the username does not exist.

                return next();
            }

            const token = await seal({
                exp: Date.now() + ((1000 * 60) * 90), // 90 minutes in milliseconds
                username: model.username,
            } as ResetToken, IRON_PASSWORD);

            const url = `${req.domainWithProtocol}/auth/reset-password?token=${encodeURIComponent(token)}`;
            const message = {
                content: {
                    from: {
                        name: "Support",
                        email: `support@${EMAIL_DOMAIN}`,
                    },
                    subject: `[${APP_NAME}] Reset your password.`,
                    html: `<p>Hello,</p><p>You recently requested to reset your password for ${APP_NAME}. Please click the link below to reset your password.</p><p><a href='${url}'>Click here to reset your password.</a></p><p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 90 minutes.</p><p>Thanks, <br/> The ${APP_NAME} Team</p>`
                },
                recipients: [{
                    address: {
                        email: model.username,
                    }
                }]
            }

            //Send the password reset email
            const transporter = createTransport({ transport: 'sparkpost', sparkPostApiKey: SPARKPOST_API_KEY } as any);

            transporter.sendMail(message, (error, info) => {
                if (error) {
                    return next(boom.wrap(error));
                };

                res.json({});

                return next();
            });
        }
    })

    route({
        method: "post",
        path: BASE_PATH + "password/reset",
        requireAuth: false,
        bodyValidation: gwv.object<Requests.ResetPassword>({
            new_password: gwv.string().min(6).max(100).required(),
            reset_token: gwv.string().required(),
        }),
        handler: async function (req, res, next) {
            const payload: Requests.ResetPassword = req.validatedBody;
            const token = await unseal<ResetToken>(payload.reset_token, IRON_PASSWORD);

            if (token.exp < Date.now()) {
                // Token has expired
                return next(boom.unauthorized("Token has expired."));
            }

            let user = await UserDb.get(token.username.toLowerCase());
            user.hashed_password = hashSync(payload.new_password);
            user = await UserDb.put(user._id, user, user._rev);

            res.json({});

            return next();
        }
    })

    route({
        method: "put",
        path: BASE_PATH + "password",
        requireAuth: true,
        bodyValidation: gwv.object<Requests.UpdatePassword>({
            old_password: gwv.string().required(),
            new_password: gwv.string().min(6).max(100).required()
        }),
        handler: async function (req, res, next) {
            const payload: Requests.UpdatePassword = req.validatedBody;
            let user = await UserDb.get(req.user._id);

            // Ensure the user's current password is correct
            if (!compareSync(payload.old_password, user.hashed_password)) {
                return next(boom.forbidden(`Your current password is incorrect.`));
            }

            // Change the user's password
            user.hashed_password = hashSync(payload.new_password);

            try {
                user = await UserDb.put(user._id, user, user._rev);
            } catch (e) {
                inspect("Failed to update user's password.", e);

                return next(e);
            }

            await res.withSessionToken(user);

            return next();
        }
    })
}