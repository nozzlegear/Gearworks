import * as joi from "joi";
import * as boom from "boom";
import { Express } from "express";
import Plans from "../../modules/plans";
import { createTransport } from "nodemailer";
import { RouterFunction, User } from "gearworks";
import { users } from "./../../modules/database";
import { hashSync, compareSync } from "bcryptjs";
import { seal, unseal } from "../../modules/encryption";
import { RecurringCharges, Models } from "shopify-prime";
import { ISLIVE, EMAIL_DOMAIN, APP_NAME, SPARKPOST_API_KEY } from "../../modules/constants";

export const BASE_PATH = "/api/v1/accounts/";

export const PATH_REGEX = /\/api\/v1\/accounts*?/i;

export default function registerRoutes(app: Express, route: RouterFunction) {
    route({
        method: "post",
        path: BASE_PATH,
        requireAuth: false,
        bodyValidation: joi.object({
            username: joi.string().email().required(),
            password: joi.string().min(6).max(100).required(),
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { username: string, password: string };
            const user = await users.post({
                _id: model.username,
                hashed_password: hashSync(model.password),
                date_created: new Date().toISOString(),
            });

            res = await res.withSessionToken(user);

            return next();
        }
    });

    route({
        method: "post",
        path: BASE_PATH + "password/forgot",
        requireAuth: false,
        bodyValidation: joi.object({
            username: joi.string().email().required()
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { username: string };
            let user: User;

            try {
                user = await users.get(model.username.toLowerCase());
            }
            catch (e) {
                const error: boom.BoomError = e;

                if (error.output && error.output.statusCode !== 404) {
                    console.error(`Error getting user ${model.username} from database.`, e)

                    return next(e);
                }

                return next();
            }

            const token = await seal({
                exp: Date.now() + ((1000 * 60) * 90), // 90 minutes in milliseconds
                username: model.username,
            });

            const url = `${req.domainWithProtocol}/auth/reset-password?token=${token}`.replace(/\/+/ig, "/");
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
        method: "put",
        path: BASE_PATH + "password",
        requireAuth: true,
        bodyValidation: joi.object({
            old_password: joi.string().when("reset_token", { is: undefined, then: joi.string().required() }),
            new_password: joi.string().min(6).max(100).required(),
            reset_token: joi.string().required().when("old_password", { is: undefined, then: joi.string().required() })
        }),
        handler: async function (req, res, next) {
            const payload = req.validatedBody as { old_password: string, new_password: string };
            const user = await users.get(req.user._id);

            // Ensure the user's current password is correct
            if (!compareSync(payload.old_password, user.hashed_password)) {
                return next(boom.forbidden(`old_password does not match.`));
            }

            // Change the user's password
            user.hashed_password = hashSync(payload.new_password);

            try {
                const update = await users.put(user);
            } catch (e) {
                console.error("Failed to update user's password.", e);

                return next(e);
            }

            await res.withSessionToken(user);

            return next();
        }
    })

    route({
        method: "post",
        path: BASE_PATH + "plan",
        requireAuth: true,
        bodyValidation: joi.object({
            plan_id: joi.string().only(Plans.map(p => p.id)).required(),
        }),
        handler: async function (req, res, next) {
            if (!req.user.charge_id) {
                return next(boom.notAcceptable(`User must have a current subscription charge before plan can be changed.`));
            }

            const model = req.validatedBody as { plan_id: string };
            const plan = Plans.find(p => p.id === model.plan_id);
            const service = new RecurringCharges(req.user.shopify_domain, req.user.shopify_access_token);

            // Get the user's current charge so we can transfer their trial days 
            const currentCharge = await service.get(req.user.charge_id, { fields: "trial_ends_on" });

            // Figure out the new trial length by checking if current charge's trial_ends_on hasn't happened yet (Today < Tomorrow)
            const trialDays = Math.round((new Date(currentCharge.trial_ends_on).valueOf() - new Date().valueOf()) / 1000 / 60 / 60 / 24);

            // The new charge will replace the user's current charge on activation.
            const charge = await service.create({
                name: plan.name,
                price: plan.price,
                test: !ISLIVE,
                trial_days: trialDays > 0 ? trialDays : 0,
                return_url: `${req.domainWithProtocol}/shopify/activate-charge?plan_id=${plan.id}`.toLowerCase(),
            });

            res.json(charge);

            return next();
        }
    })

    route({
        method: "put",
        path: BASE_PATH + "plan",
        requireAuth: true,
        bodyValidation: joi.object({
            plan_id: joi.string().only(Plans.map(p => p.id)).required(),
            charge_id: joi.any().required(),
        }),
        handler: async function (req, res, next) {
            const model = req.validatedBody as { plan_id: string, charge_id: number };
            const plan = Plans.find(p => p.id === model.plan_id);
            const service = new RecurringCharges(req.user.shopify_domain, req.user.shopify_access_token);
            let charge: Models.RecurringCharge;

            try {
                charge = await service.get(model.charge_id);

                //Charges can only be activated when they've been accepted
                if (charge.status !== "accepted") {
                    return next(boom.expectationFailed(`Charge ${model.charge_id} has not been accepted.`));
                }
            } catch (e) {
                console.error("Recurring charge error", e);

                // Charge has expired or was declined. Send the user to select a new plan.
                return next(boom.expectationFailed("Could not find recurring charge. It may have expired or been declined."));
            }

            await service.activate(charge.id);

            // Update the user's planid
            let user = await users.get(req.user._id);
            user.plan_id = plan.id;
            user.charge_id = charge.id;

            try {
                user = await users.put(user);
            } catch (e) {
                console.error(`Activated new subscription plan but failed to update user ${req.user._id} plan id.`, e);

                return next(e);
            }

            await res.withSessionToken(user);

            return next();
        }
    })
}