/// <reference path="./../../typings/typings.d.ts" />

import {Server} from "hapi";
import * as path from "path";

export function registerRoutes(server: Server)
{
    server.route({
        method: "GET",
        path: "/wwwroot/{path*}",
        handler: (request, reply) =>
        {
            return reply.file(path.resolve(server.app.rootDir, "../", "wwwroot", request.params["path"]));
        },
        config: {
            auth: false,
        }
    });
    
    server.route({
        method: "GET",
        path: "/images/{path*}",
        handler: (request, reply) =>
        {
            return reply.file(path.resolve(server.app.rootDir, "../", "images", request.params["path"]));
        },
        config: {
            auth: false,
        }
    });
}