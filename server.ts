import * as path from "path";
import * as express from "express";
import { BoomError, wrap } from "boom";
import { VERSION } from "./modules/constants";
import { json as parseJson, urlencoded as parseUrlEncoded } from "body-parser";

// Server configurations
import configureDatabase from "./modules/database";
import configureCache from "./modules/cache";
import configureRoutes from "./routes";

const app = express();

async function startServer() {
    app.use((req, res, next) => {
        res.setHeader("x-powered-by", `Gearworks v${VERSION} https://github.com/nozzlegear/gearworks`);

        next();
    });

    if (process.argv.some(arg => arg === "--dev")) {
        // Create a webpack dev server
        const config = require(path.resolve(__dirname, "..", "webpack.config"));
        const webpack = require("webpack");
        const compiler = webpack(config);

        app.use(require('webpack-dev-middleware')(compiler, {
            publicPath: config.output.publicPath,
            noInfo: true,
            watchOptions: {
                poll: true
            },
            stats: {
                colors: true
            }
        }));

        app.use(require('webpack-hot-middleware')(compiler));
    } else {
        // Any request to the /dist path should server a static file from the dist folder.
        app.use("/dist", express.static("dist"));
    }

    // Let express trust the proxy that may be used on certain hosts (e.g. Azure and other cloud hosts). 
    // Enabling this will replace the `request.protocol` with the protocol that was requested by the end user, 
    // rather than the internal protocol used by the proxy.
    app.enable("trust proxy");

    // Set up request body parsers
    app.use(parseJson());
    app.use(parseUrlEncoded({ extended: true }));

    // Configure the server
    await configureCache();
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
            console.log(`Error in ${req.url}`, err);
        }

        res.status(fullError.output.statusCode).json(fullError.output.payload);

        return next();
    } as any);
}

startServer().then(() => {
    // Start the server
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || "localhost";

    app.listen(port, host, () => {
        console.log(`Server listening on ${host}:${port}`);
    })
}).catch(e => {
    console.error("Error starting server.", e);
});