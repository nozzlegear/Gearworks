/// <reference path="./typings/typings.d.ts" />

import * as Hapi from "hapi";
import * as joi from "joi";
import * as boom from "boom";
import * as path from "path"; 
import * as util from "util";
import {promisify} from "bluebird";
import * as config from "./modules/config";
import {RoutesToRegister} from "./routes/index";
import {defaults, isError, merge} from "lodash";
import {Server, ServerApp, DefaultContext} from "gearworks";
import {IProps as ErrorPageProps} from "./views/errors/error";
import {DefaultTTL, CacheName, registerCaches} from "./modules/cache";
import {configureAuth} from "./modules/auth";

//Prepare Hapi server
const server: Server = new Hapi.Server() as Server;
const serverConfig: Hapi.IServerConnectionOptions = {
    port: config.Port || 3000,
    host: config.Host || "localhost",
    router: {
        isCaseSensitive: false,
        stripTrailingSlash: true
    }
};
const connection = server.connection(serverConfig);

async function registerPlugins()
{
    //Inert gives Hapi static file and directory handling via reply.file and reply.directory.
    await server.register(require("inert"));
    
    //Vision gives Hapi dynamic view rendering.
    await server.register(require("vision"));
    
    //Adds async support to Hapi route handlers.
    await server.register(require("hapi-async-handler"));

    //Crumb gives Hapi automatic CSRF protection.
    await server.register(require("crumb"));
    
    //Yar is a cookie management plugin for Hapi.
    await server.register({
        register: require("yar"),
        options: {
            storeBlank: false,
            cookieOptions: {
                password: config.YarSalt,
                isSecure: server.app.isLive,
                ttl: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
                ignoreErrors: true, //tells Hapi that it should not respond with a HTTP 400 error if the session cookie cannot decrypt
                clearInvalid: true  //tells Hapi that if a session cookie is invalid for any reason, to clear it from the browser.
            }
        }
    })
    
    await registerCaches(server);
}

async function startServer()
{
    //Validate environment variables
    Object.getOwnPropertyNames(config).forEach((prop, index, propNames) =>
    {
        // Ensure config prop isn't optional
        if (config.OptionalProps.indexOf(prop) === -1 && !config[prop])
        {
            throw new Error(`Configuration property ${prop} cannot be null or empty. Check modules/config.ts to find the correct environment variable key for ${prop}.`);
        }
    })
    
    //Configure the server's app state
    server.app = {
        appName: config.AppName,
        isLive: process.env.NODE_ENV === "production",
        rootDir: path.resolve(__dirname),
    };
    
    await registerPlugins();
    
    //Configure authentication. Must be done before configuring routes
    configureAuth(server);
    
    //Set the viewengine to use react
    server.views({
        engines: {
            js: require("hapi-react-views")
        },
        compileOptions: {},
        relativeTo: server.app.rootDir,
        path: "views",
        context: {
            appName: server.app.appName,
            isLive: server.app.isLive,
        } as DefaultContext
    });
    
    //Filter all responses to check if they have an error. If so, render the error page.
    server.ext("onPreResponse", (request, reply) =>
    {
        const resp = request.response;
        
        if (request.response.isBoom || isError(request.response))
        {
            const resp: Boom.BoomError = request.response as any;
            const payload: { error: string, message: string, statusCode: number } = resp.output.payload;
            const props: ErrorPageProps = {
                errorType: payload.error,
                message: payload.message,
                statusCode: payload.statusCode,
                title: payload.error,
            };
            
            console.log(`${payload.statusCode} ${payload.error} for ${request.url.pathname}. ${resp.message}.`, payload.statusCode >= 500 ? util.inspect(resp) : "");

            return (reply.view("errors/error.js", props)).code(payload.statusCode);
        }

        request.response.header("X-POWERED-BY", "Gearworks https://github.com/nozzlegear/gearworks");
        
        return reply.continue();
    });    
    
    //Register all app routes.
    RoutesToRegister.forEach((register) => register(server));
    
    return server.start((error) =>
    {
        if (error)
        {
            throw error;
        }
        
        console.log(`${server.app.isLive ? "Live" : "Development"} server running at ${server.info.uri}`);
    })
}

//Start the server
startServer().catch((err) =>
{
    console.log("Hapi server registration error.", err);
    
    throw err;
});