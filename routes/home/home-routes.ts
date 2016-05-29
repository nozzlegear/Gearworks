/// <reference path="./../../typings/typings.d.ts" />

import {Server} from "gearworks";
import {Request, IReply} from "hapi";
import {IProps} from "./../../views/home/home";

export function registerRoutes(server: Server)
{
    server.route({
        path: "/",
        method: "GET",
        handler: {
            async: (request, reply) => getHomepage(server, request, reply)
        }
    })
}

export async function getHomepage(server: Server, request: Request, reply: IReply)
{
    const props: IProps = {
        title: "Your Dashboard",
    }
    
    return reply.view("home/home.js", props)
}