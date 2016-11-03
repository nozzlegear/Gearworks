// Polyfill fetch
require("node-fetch");

import * as path from "path";
import * as express from "express";
import { BoomError, wrap } from "boom";
import { json as parseJson, urlencoded as parseUrlEncoded } from "body-parser";

const app = express();

async function startServer() {
    if (process.argv.some(arg => arg === "--dev")) {
        // Create a webpack dev server
        const config = require(path.resolve(__dirname, "..", "webpack.config"));
        const webpack = require("webpack");
        const compiler = webpack(config);

        app.use(require('webpack-dev-middleware')(compiler, {
            publicPath: config.output.publicPath,
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

    // Set up request body parsers
    app.use(parseJson());
    app.use(parseUrlEncoded({ extended: true }));

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
    app.listen(process.env.PORT || 3000, process.env.HOST || "localhost", () => {
        console.log("Server listening on port 3000");
    })
}).catch(e => {
    console.error("Error starting server.", e);
});