import * as express from 'express';
import * as http from 'http';
import * as httpsRedirect from 'redirect-https';
import * as os from 'os';
import * as path from 'path';
import configureDatabase from './modules/database';
import configureRoutes from './routes';
import inspect from 'logspect';
import { BoomError, wrap } from 'boom';
import { EMAIL_DOMAIN, ISLIVE } from './modules/constants';

async function startServer(hostname: string, port: number) {
    const app = express();

    app.use((req, res, next) => {
        res.setHeader("x-powered-by", `Gearworks https://github.com/nozzlegear/gearworks`);

        next();
    });

    if (ISLIVE) {
        // Redirect all requests to https if we're on a production server.
        app.use(httpsRedirect());
    }

    // Any request to the /dist or /images paths should serve static files.
    app.use("/dist", express.static("dist"));
    app.use("/images", express.static("images"));

    // Let express trust the proxy that may be used on certain hosts (e.g. Azure and other cloud hosts). 
    // Enabling this will replace the `request.protocol` with the protocol that was requested by the end user, 
    // rather than the internal protocol used by the proxy.
    app.enable("trust proxy");

    // Configure the server
    await configureDatabase();
    await configureRoutes(app);

    // Wildcard route must be registered after all other routes.
    app.get("*", (req, res) => {
        if (res.finished) {
            return;
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
    } as any);

    return http.createServer(app).listen(port, hostname);
}

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3000;

startServer(host, port).then(server => {
    inspect(`HTTP and HTTPS servers are listening on ${host}:${port}.`);
}).catch(e => {
    inspect("Error starting server.", e);
});