/// <reference path="./typings/typings.d.ts" />

import * as Hapi from "hapi";
import * as joi from "joi";
import * as boom from "boom";
import * as path from "path"; 
import * as util from "util";
import {RoutesToRegister} from "./routes/index";
import {defaults, isError, merge} from "lodash";
import {Server, ServerApp, DefaultContext} from "gearworks";
import {IProps as ErrorPageProps} from "./views/errors/error";
import {configureAuth, encryptionSignature, yarSalt} from "./modules/auth";

//Prepare Hapi server
const server: Server = new Hapi.Server();
const config: Hapi.IServerConnectionOptions = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || "localhost",
    router: {
        isCaseSensitive: false,
        stripTrailingSlash: true
    }
};
const connection = server.connection(config);

async function registerPlugins()
{
    //Inert gives Hapi static file and directory handling via reply.file and reply.directory.
    await server.register(require("inert"));
    
    //Vision gives Hapi dynamic view rendering.
    await server.register(require("vision"));
    
    //Adds async support to Hapi route handlers.
    await server.register(require("hapi-async-handler"));
    
    //Yar is a cookie management plugin for Hapi.
    await server.register({
        register: require("yar"),
        options: {
            storeBlank: false,
            cookieOptions: {
                password: yarSalt,
                isSecure: server.app.isLive,
                ttl: 7 * 24 * 60 * 60 * 1000 , // Cookie expires in 7 days
                ignoreErrors: true, //tells Hapi that it should not respond with a HTTP 400 error if the session cookie cannot decrypt
                clearInvalid: true  //tells Hapi that if a session cookie is invalid for any reason, to clear it from the browser.
            }
        }
    })
}

async function startServer()
{
    //Encryption signature is required for authentication.
    if (!encryptionSignature || encryptionSignature.length < 32)
    {
        throw new Error("process.env.encryptionSignature must be a 32-char-or-greater random string.");
    }
    
    if (!yarSalt || yarSalt.length < 32)
    {
        throw new Error("process.env.yarSalt must be a 32-char-or-greater random string.");
    }
    
    //Configure the server's app state
    server.app = defaults(require("../gearworks.private.json"), {
        appName: "Gearworks",
        rootDir: path.resolve(__dirname),
        shopifyApiKey: process.env.shopifyApiKey,
        shopifySecretKey: process.env.shopifySecretKey,
        stripePublishableKey: process.env.stripePublishableKey,
        stripeSecretKey: process.env.stripeSecretKey,
        isLive: process.env.NODE_ENV === "production",
    } as ServerApp) as ServerApp;
    
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