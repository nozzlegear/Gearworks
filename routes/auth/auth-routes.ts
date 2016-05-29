/// <reference path="./../../typings/typings.d.ts" />

import * as joi from "joi";
import * as boom from "boom";
import * as pouch from "pouchdb";
import {Request, IReply} from "hapi";
import {Server, User} from "gearworks";
import {hashSync, compareSync} from "bcrypt";
import {users} from "./../../modules/database";
import {humanizeError} from "./../../modules/validation";
import {IProps as LoginProps} from "./../../views/auth/login";
import {setAuthCookie, cookieName} from "./../../modules/auth";
import {IProps as RegisterProps} from "./../../views/auth/register";

export function registerRoutes(server: Server)
{
    server.route({
        path: "/auth/login",
        method: "GET",
        config: {
            auth: false
        },
        handler: {
            async: (request, reply) => getLoginForm(server, request, reply)
        }
    });
    
    server.route({
        path: "/auth/login",
        method: "POST",
        config: {
            auth: false
        },
        handler: {
            async: (request, reply) => login(server, request, reply)
        }
    });
    
    server.route({
        path: "/auth/logout",
        method: "GET",
        config: {
            auth: false
        },
        handler: {
            async: (request, reply) => logout(server, request, reply)
        }
    });
    
    server.route({
        path: "/auth/register",
        method: "GET",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => getRegisterForm(server, request, reply)
        },
    });
    
    server.route({
        path: "/auth/register",
        method: "POST",
        config: {
            auth: false,
        },
        handler: {
            async: (request, reply) => register(server, request, reply)
        },
    })
}

export async function getLoginForm(server: Server, request: Request, reply: IReply)
{
    const props: LoginProps = {
        title: "Sign in to your account."
    }
    
    return reply.view("auth/login.js", props);
}

export async function login(server: Server, request: Request, reply: IReply)
{
    const payload = request.payload as {
        username: string;
        password: string;
    };
    const props: LoginProps = {
        username: payload.username,
        title: "Sign in to your account", 
    };
    
    let user: User;
    let passwordMatches = false;
    
    try
    {
        user = await users.get<User>(payload.username.toLowerCase());
        
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
    setAuthCookie(request, user._id, user.username);
    
    return reply.redirect("/");
}

export async function logout(server: Server, request: Request, reply: IReply)
{
    request.yar.clear(cookieName);
    
    return reply.redirect("/auth/login");
}

export async function getRegisterForm(server: Server, request: Request, reply: IReply)
{
    const props: RegisterProps = {
        title: "Create an account."
    }
    
    return reply.view("auth/register.js", props);
}

export async function register(server: Server, request: Request, reply: IReply): Promise<any>
{
    let payload = request.payload as {
        username: string;
        password: string;  
    };
    let props: LoginProps = {
        username: payload.username,
        title: "Create an account" 
    };
    let validation = joi.validate(payload, registerValidation);
    
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
        user = await users.get<User>(payload.username.toLowerCase());
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
    
    const create = await users.put(user);
    
    if (!create.ok)
    {
        return reply(boom.expectationFailed("Could not create new user."));
    }
    
    //Log the user in
    await setAuthCookie(request, user._id, user.username);
    
    return reply.redirect("/setup");
}

const registerValidation = joi.object().keys({
    password: joi.string().min(6).required(),
    username: joi.string().min(3).required(),
});