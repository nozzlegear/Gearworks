/// <reference path="./../../typings/typings.d.ts" />

import {find} from "lodash";
import {Server} from "gearworks";
import {Request, IReply} from "hapi";
import {compareSync} from "bcrypt";
import {IProps as LoginProps} from "./../../views/auth/login";
import {setAuthCookie, cookieName} from "./../../modules/auth";

export function registerRoutes(server: Server)
{
    server.route({
        path: "/auth/login",
        method: "GET",
        config: {
            auth: false
        },
        handler: {
            async: async (request, reply) => await getLoginForm(server, request, reply)
        }
    });
    
    server.route({
        path: "/auth/login",
        method: "POST",
        config: {
            auth: false
        },
        handler: {
            async: async (request, reply) => await login(server, request, reply)
        }
    });
    
    server.route({
        path: "/auth/logout",
        method: "GET",
        config: {
            auth: false
        },
        handler: {
            async: async (request, reply) => await logout(server, request, reply)
        }
    });
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
    
    const users = [
        {
            username: "Nozzlegear",
            password: "$2a$10$e9afGVvpfCorbImb3nJYP.uvzVBXJPEjLBHl/v5lYc6LXCMVhd/7O",
            id: 1
        }
    ];
    
    const user = find(users, u => u.username.toLowerCase() === payload.username.toLowerCase());
    let passwordMatches = false;
    
    if (user)
    {
        //Check if password matches the one stored in the database
        passwordMatches = compareSync(payload.password, user.password);
    }
    
    if (!user || !passwordMatches)
    {
        const props: LoginProps = {
            username: payload.username,
            title: "Sign in to your account.",
            error: "Username or password is incorrect."
        }
        
        return reply.view("auth/login.js", props);
    }
    
    console.log("Successful login");
    
    //Successful login
    setAuthCookie(request, user.id, user.username);
    
    return reply.redirect("/");
}

export async function logout(server: Server, request: Request, reply: IReply)
{
    request.yar.clear(cookieName);
    
    return reply.redirect("/auth/login");
}