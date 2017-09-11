import * as Cache from 'gearworks-cache';
import * as Constants from '../shared/constants';
import * as Databases from './database';
import * as express from 'express';
import * as http from 'http';
import * as httpsRedirect from 'redirect-https';
import * as path from 'path';
import * as routeConfigurations from './routes';
import getRouter from 'gearworks-route/bin';
import inspect from 'logspect';
import { BoomError, notFound, wrap } from 'boom';
import { configureDatabase, DatabaseConfiguration } from 'davenport/bin';
import { importToArray } from 'import-to-array';
import { User } from 'app';

// This is injected by Webpack during the build process. Unfortunately necessary because
// Zeit's pkg tool has a bug that makes it impossible to call .toString() on a function and
// get its source code, which we use in the CouchDB views.
declare const _DB_CONFIGURATIONS: DatabaseConfiguration<any>[];

async function startServer(hostname: string, port: number) {
    const app = express();

    app.use((req, res, next) => {
        res.setHeader("x-powered-by", `Gearworks https://github.com/nozzlegear/gearworks`);

        next();
    });

    // Any request to the /dist or /images paths should serve static files.
    // NOTE: We're combining with dirname + ../ because this app may be running inside Zeit's pkg where such things are necessary.
    app.use("/dist", express.static(path.join(__dirname, "..", "dist")));
    app.use("/resources", express.static(path.join(__dirname, "..", "resources")));

    // Let express trust the proxy that may be used on certain hosts (e.g. Azure and other cloud hosts).
    // Enabling this will replace the `request.protocol` with the protocol that was requested by the end user,
    // rather than the internal protocol used by the proxy.
    app.enable("trust proxy");

    // Redirect http requests to https when live
    if (Constants.ISLIVE) {
        app.use(httpsRedirect());
    }

    // Prepare the router
    const router = getRouter<User>(app, {
        auth_header_name: Constants.AUTH_HEADER_NAME,
        iron_password: Constants.IRON_PASSWORD,
        jwt_secret_key: Constants.JWT_SECRET_KEY,
        sealable_user_props: [],
        shopify_secret_key: "unused",
        userAuthIsValid: async user => {
            // If user id exists in invalidation cache, return a 401 unauthed response.
            try {
                const cacheValue = await Cache.getValue(Constants.CACHE_SEGMENT_AUTH, user._id);

                if (!!cacheValue) {
                    return false;
                }
            } catch (e) {
                inspect(`Error attempting to retrieve ${user._id} value from auth-invalidation cache.`, e);

                return false;
            }

            return true;
        },
    });

    // Configure the server, cache, databases and routes
    const httpServer = http.createServer(app).listen(port, hostname);
    await Cache.initialize();
    await Promise.all(Object.keys(_DB_CONFIGURATIONS)
        .filter(prop => prop !== "__esModule")
        .map(prop => configureDatabase(Constants.COUCHDB_URL, _DB_CONFIGURATIONS[prop], { warnings: false })));
    await Promise.all(importToArray(routeConfigurations).map(r => r(app, router)));

    // Wildcard route must be registered after all other routes.
    const notFoundPaths = [/dist\//i, /images\//i, /api\//i];
    app.get("*", (req, res) => {
        if (res.finished) {
            return;
        }

        if (notFoundPaths.some(regex => regex.test(req.url))) {
            throw notFound();
        }

        res.sendFile(path.join(__dirname, "..", "index.html"));
    })

    // Typescript type guard for boom errors
    function isBoomError(err): err is BoomError {
        return err.isBoom;
    }

    // Register an error handler for all routes
    app.use(function (err: Error | BoomError, req: express.Request, res: express.Response, next: Function) {
        const fullError = isBoomError(err) ? err : wrap(err);

        if (fullError.output.statusCode >= 500) {
            inspect(`Error in ${req.url}`, err);
        }

        res.status(fullError.output.statusCode).json(fullError.output.payload);

        return next();
    });

    return httpServer;
}

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3000;

startServer(host, port).then(server => {
    inspect(`HTTP and HTTPS servers are listening on ${host}:${port}.`);
}).catch(e => {
    inspect("Error starting server.", e);
});