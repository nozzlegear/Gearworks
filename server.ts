import * as os from "os";
import * as path from "path";
import * as http from "http";
import * as https from "https";
import inspect from "logspect";
import * as express from "express";
import { BoomError, wrap } from "boom";
import * as httpsRedirect from "redirect-https";
import * as letsEncrypt from "letsencrypt-express";
import { ISLIVE, EMAIL_DOMAIN } from "./modules/constants";

// Server configurations
import configureDatabase from "./modules/database";
import configureCache from "./modules/cache";
import configureRoutes from "./routes";

async function startServer(hostname: string, port: number, securePort: number) {
    const app = express();

    app.use((req, res, next) => {
        res.setHeader("x-powered-by", `Gearworks https://github.com/nozzlegear/gearworks`);

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
    }

    // Any request to the /dist or /images paths should serve static files.
    app.use("/dist", express.static("dist"));
    app.use("/images", express.static("images"));

    // Let express trust the proxy that may be used on certain hosts (e.g. Azure and other cloud hosts). 
    // Enabling this will replace the `request.protocol` with the protocol that was requested by the end user, 
    // rather than the internal protocol used by the proxy.
    app.enable("trust proxy");

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
            inspect(`Error in ${req.url}`, err);
        }

        res.status(fullError.output.statusCode).json(fullError.output.payload);

        return next();
    } as any);

    // Prepare encryption
    const lexTempDir = path.join(os.tmpdir(), "acme-challenges");
    const lex = letsEncrypt.create({
        // You must set server to https://acme-v01.api.letsencrypt.org/directory after you have tested that your setup works.
        server: (!ISLIVE) ? "staging" : "https://acme-v01.api.letsencrypt.org/directory",
        challenges: { 'tls-sni-01': require('le-challenge-sni').create({ webrootPath: lexTempDir }) },
        challengeType: 'tls-sni-01',
        store: require('le-store-certbot').create({ webrootPath: lexTempDir }),
        approveDomains: !ISLIVE ? ["127.0.0.1"] : (options: { email: string, agreeTos: boolean, domains: string[] }, certs, cb) => {
            options.email = `support@${EMAIL_DOMAIN}`;
            options.agreeTos = true;
            options.domains = (certs && certs.altnames) || options.domains;

            if (!options.domains.every(domain => domain.toLowerCase().indexOf(EMAIL_DOMAIN.toLowerCase()) >= -0)) {
                const msg = `Attempted to approve a domain that wasn't ${EMAIL_DOMAIN} or a subdomain thereof.`;

                inspect(msg, options.domains);

                return cb(new Error(msg));
            }

            cb(null, { options, certs });
        },
        email: `support@${EMAIL_DOMAIN}`,
        agreeTos: true,
    });

    return {
        http: http.createServer(ISLIVE ? httpsRedirect() : app).listen(port, hostname),
        https: https.createServer(lex.httpsOptions, lex.middleware(app)).listen(securePort, hostname),
    };
}

const host = process.env.HOST || "127.0.0.1";
const port = process.env.PORT || 3000;
const securePort = process.env.SECURE_PORT || 3001;

startServer(host, port, securePort).then((servers: { http: http.Server, https: https.Server }) => {
    inspect(`HTTP and HTTPS servers are listening on ${host}:${port} and ${host}:${securePort}.`);
}).catch(e => {
    inspect("Error starting server.", e);
});