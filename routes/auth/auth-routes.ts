/// <reference path="./../../typings/typings.d.ts" />

import * as joi from "joi";
import * as boom from "boom";
import * as pouch from "pouchdb";
import * as guid from "node-uuid";
import {createTransport} from "nodemailer";
import {hashSync, compareSync} from "bcrypt";
import * as config from "../../modules/config";
import {Request, IReply, IBoom, Response} from "hapi";
import {getRequestDomain} from "../../modules/requests";
import {humanizeError} from "./../../modules/validation";
import {Server, User, PasswordResetUser} from "gearworks";
import {IProps as LoginProps} from "./../../views/auth/login";
import {setUserAuth, cookieName} from "./../../modules/auth";
import {IProps as RegisterProps} from "./../../views/auth/register";
import {IProps as ResetSentProps} from "./../../views/auth/reset_sent";
import {Users, findUserByPasswordResetToken} from "./../../modules/database";
import {IProps as ResetPasswordProps} from "./../../views/auth/reset_password";
import {IProps as ForgotPasswordProps} from "./../../views/auth/forgot_password";

export const Routes = {
    GetLogin: "/auth/login",
    PostLogin: "/auth/login",
    GetLogout: "/auth/logout",
    GetRegister: "/auth/register",
    PostRegister: "/auth/register",
    GetForgotPassword: "/auth/forgot-password",
    PostForgotPassword: "/auth/forgot-password",
    GetResetSent: "/auth/reset-sent",
    GetResetPassword: "/auth/reset-password",
    PostResetPassword: "/auth/reset-password",
}

const JoiValidation = {
    login: joi.object().keys({
        username: joi.string().label("Email address"),
        password: joi.string().label("Password"),
    }),
    register: joi.object().keys({
        password: joi.string().min(6).label("Password"),
        username: joi.string().min(3).email().label("Email address"),
    }),
    forgotPassword: joi.object().keys({
        username: joi.string().label("Email address"),
    }),
    resetPassword: joi.object().keys({
        password: joi.string().min(6).label("Password"),
        confirmPassword: joi.string().label("Password"),
        token: joi.string().label("Reset token"),
    }),
}

export function registerRoutes(server: Server)
{
    server.route({
        path: Routes.GetLogin,
        method: "GET",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => getLogin(server, request, reply)
        }
    });
    
    server.route({
        path: Routes.PostLogin,
        method: "POST",
        config: {
            auth: false
        },
        handler: {
            async: (request, reply) => postLogin(server, request, reply)
        }
    });
    
    server.route({
        path: Routes.GetLogout,
        method: "GET",
        config: {
            auth: false
        },
        handler: {
            async: (request, reply) => getLogout(server, request, reply)
        }
    });
    
    server.route({
        path: Routes.GetRegister,
        method: "GET",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => getRegister(server, request, reply)
        },
    });
    
    server.route({
        path: Routes.PostRegister,
        method: "POST",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => postRegister(server, request, reply)
        },
    });

    server.route({
        path: Routes.GetForgotPassword,
        method: "GET",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => getForgotPassword(server, request, reply)
        },
    });

    server.route({
        path: Routes.PostForgotPassword,
        method: "POST",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => postForgotPassword(server, request, reply)
        },
    })

    server.route({
        path: Routes.GetResetSent,
        method: "GET",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => getResetSent(server, request, reply),
        },
    })

    server.route({
        path: Routes.GetResetPassword,
        method: "GET",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => getResetPassword(server, request, reply),
        },
    })

    server.route({
        path: Routes.PostResetPassword,
        method: "POST",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => postResetPassword(server, request, reply),
        },
    })
}

export async function getLogin(server: Server, request: Request, reply: IReply)
{
    const props: LoginProps = {
        title: "Sign in to your account."
    }
    
    return reply.view("auth/login.js", props);
}

export async function postLogin(server: Server, request: Request, reply: IReply)
{
    const validation = joi.validate<{username: string; password: string}>(request.payload, JoiValidation.login);
    const payload = validation.value;
    const props: LoginProps = {
        username: payload.username,
        title: "Sign in to your account.", 
    };

    if (validation.error)
    {
        props.error = humanizeError(validation.error);

        return reply.view("auth/login.js", props);
    }
    
    let user: User;
    let passwordMatches = false;
    
    try
    {
        user = await Users.get<User>(payload.username.toLowerCase());
        
        if (user)
        {
            //Check if password matches the one stored in the database
            passwordMatches = compareSync(payload.password, user.hashedPassword);
        }
    }
    catch (e)
    {
        let error: pouch.api.PouchError = e;
        
        if (error.status !== 404)
        {
            throw e;
        }
    }

    if (!user || !passwordMatches)
    {
        props.error = "Username or password is incorrect."        
        
        return reply.view("auth/login.js", props);
    }
    
    //Successful login
    await setUserAuth(request, user);
    
    return reply.redirect("/");
}

export async function getLogout(server: Server, request: Request, reply: IReply)
{
    request.yar.clear(cookieName);
    
    return reply.redirect("/auth/login");
}

export async function getRegister(server: Server, request: Request, reply: IReply)
{
    const props: RegisterProps = {
        title: "Create an account."
    }
    
    return reply.view("auth/register.js", props);
}

export async function postRegister(server: Server, request: Request, reply: IReply): Promise<any>
{
    let payload = request.payload as {
        username: string;
        password: string;  
    };
    let props: LoginProps = {
        username: payload.username,
        title: "Create an account" 
    };
    let validation = joi.validate(payload, JoiValidation.register);
    
    if (validation.error)
    {
        props.error = humanizeError(validation.error);
        
        return reply.view("auth/register.js", props); 
    }
    
    payload = validation.value;
    
    let user: User;
    
    //Check if a user with that name already exists
    try
    {
        user = await Users.get<User>(payload.username.toLowerCase());
        props.error = "A user with that username already exists.";
        
        return reply.view("auth/register.js", props);
    }
    catch (e)
    {
        let error: pouch.api.PouchError = e;
        
        if (error.status !== 404)
        {
            throw e;
        }
    }
    
    user = {
        _rev: undefined,
        _id: payload.username.toLowerCase(),
        username: payload.username,
        hashedPassword: hashSync(payload.password, 10),
    }
    
    const create = await Users.put(user);
    
    if (!create.ok)
    {
        return reply(boom.expectationFailed("Could not create new user."));
    }
    
    //Log the user in
    await setUserAuth(request, user);
    
    return reply.redirect("/setup");
}

export async function getForgotPassword(server: Server, request: Request, reply: IReply)
{
    const props: ForgotPasswordProps = {
        title: "Forgot your password?",
    };

    return reply.view("auth/forgot_password.js", props);
}

export async function postForgotPassword(server: Server, request: Request, reply: IReply): Promise<IBoom | Response>
{
    const props: ForgotPasswordProps = {
        title: "Forgot your password?",
    }
    const validation = joi.validate<{username: string}>(request.payload, JoiValidation.forgotPassword);
    const payload = validation.value;

    if (validation.error)
    {
        props.username = payload.username;
        props.error = humanizeError(validation.error);

        return reply.view("auth/forgot_password.js");
    }
    
    let user: PasswordResetUser;

    try
    {
        user = await Users.get<PasswordResetUser>(payload.username.toLowerCase());
    }
    catch (e)
    {
        const error: pouch.api.PouchError = e;
        
        if (error.status !== 404)
        {
            throw e;
        }

        // Do not inform the user that the username does not exist
        return reply.redirect(Routes.GetResetSent);
    }

    const token = guid.v4();

    //Save the token to the user
    user.passwordResetToken = token;
    user.passwordResetRequestedAt = new Date();

    const update = await Users.put(user);

    if (!update.ok)
    {
        console.error("Failed to save password reset data to user model.", update);

        return reply(boom.expectationFailed("Failed to save password reset data."));
    }

    const url = `${getRequestDomain(request)}/${Routes.GetResetPassword}?token=${token}`.replace(/\/+/ig, "/");
    const message = {
        content: {
            from: {
                name: "Support",
                email: `support@${config.EmailDomain.replace(/^.*@/ig, "")}`,
            },
            subject: `[${config.AppName}] Reset your password.`,
            html: `<p>Hello,</p><p>You recently requested to reset your password for ${config.AppName}. Please click the link below to reset your password.</p><p><a href='${url}'>Click here to reset your password.</a></p><p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 30 minutes.</p><p>Thanks, <br/> The ${config.AppName} Team</p>`
        },
        recipients: [{
            address: {
                email: payload.username,
            }
        }]
    }

    //Send the password reset email
    const transporter = createTransport({ transport: 'sparkpost', sparkPostApiKey: config.SparkpostKey } as any);

    transporter.sendMail(message, (error, info) =>
    {
        if (error)
        {
            return reply(boom.wrap(error));
        }

        return reply.redirect(Routes.GetResetSent);
    });
}

export async function getResetSent(server: Server, request: Request, reply: IReply)
{
    const props: ResetSentProps = {
        title: "Password reset request sent.",
    }

    return reply.view("auth/reset_sent.js", props);
}

export async function getResetPassword(server: Server, request: Request, reply: IReply): Promise<IBoom | Response>
{
    const query: {token:string} = request.query;
    const props: ResetPasswordProps = {
        title: "Reset your password.",
        token: query.token,
    }

    if (! query.token)
    {
        return reply(boom.unauthorized("Missing reset password token."));
    }

    return reply.view("auth/reset_password.js", props);
}

export async function postResetPassword(server: Server, request: Request, reply: IReply): Promise<IBoom | Response>
{
    const payload: {password: string, token: string, confirmPassword: string} = request.payload;
    const validation = joi.validate(payload, JoiValidation.resetPassword);
    const props: ResetPasswordProps = {
        title: "Reset your password.",
        token: payload.token,
    }

    if (validation.error)
    {
        props.error = humanizeError(validation.error);

        return reply.view("auth/reset_password.js", props);
    }

    if (payload.confirmPassword !== payload.password)
    {
        props.error = "Passwords do not match.";

        return reply.view("auth/reset_password.js", props);
    }

    // Ensure the user's password token is still valid
    const user = await findUserByPasswordResetToken(payload.token);

    if (!user || user.passwordResetToken !== payload.token || new Date(user.passwordResetRequestedAt as string) < new Date(new Date().getTime() - (30 * 60 * 1000) /* 30 minutes */))
    {
        props.error = "Your password reset request has expired.";

        return reply.view("auth/reset_password.js", props);
    }

    // Reset user's password
    user.passwordResetToken = undefined;
    user.passwordResetRequestedAt = undefined;
    user.hashedPassword = hashSync(payload.password, 10);

    const update = await Users.put(user);

    if (!update.ok)
    {
        console.error("Failed to save user's new password during password reset request.", update);

        return reply(boom.expectationFailed("Failed to save user's new password during password reset request.")); 
    }

    return reply.redirect(Routes.GetLogin);
}