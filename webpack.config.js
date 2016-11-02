"use strict";

// Hack for Ubuntu on Windows: interface enumeration fails with EINVAL, so return empty.
try {
  require('os').networkInterfaces()
} 
catch (e) {
  require('os').networkInterfaces = () => ({})
}

const webpack      = require("webpack");
const precss       = require('precss');
const autoprefixer = require('autoprefixer');
const pkg          = require("./package.json");
const lodashPack   = require("lodash-webpack-plugin");
const process      = require("process");
const path         = require("path");

const config = {
    entry: [
        path.join(__dirname, "client/app.tsx"),
    ],
    output: {
        path: path.join(__dirname, "dist"),
        publicPath: path.join(__dirname, "dist"), //Must be set for webpack-dev-server
        filename: "app.js",
    },
    resolve: {
        root:  process.cwd(),
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
    },
    externals: { },
    devtool: "source-map",
    plugins: [
        new lodashPack,
        new webpack.optimize.OccurenceOrderPlugin,
        new webpack.DefinePlugin({
            "_VERSION": `"${pkg.version}"`,
        })
    ],
    module: {
        loaders: [
            { 
                test: /\.tsx?$/i, 
                loader: 'awesome-typescript-loader',
                query: {
                    useBabel: true,
                    useCache: true
                }
            },
            {
                loader: 'babel-loader',
                test: /\.js$/i,
                exclude: /node_modules/,
                query: {
                    plugins: ['lodash'],
                    presets: ['es2015'],
                },
            },
            {
                test: /\.css$/i,
                loaders: ["style", "css", "postcss-loader"]
            },
            {
                test: /\.json$/i,
                loaders: ["json"],
            },
            {
                test: /\.(jpe?g|png|gif|svg)$/i,
                loaders: [
                    'file?hash=sha512&digest=hex&name=[hash].[ext]',
                    'image-webpack?bypassOnDebug&optimizationLevel=7&interlaced=false'
                ]
            }
        ],
        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },
    postcss: () => [precss, autoprefixer],
    watchOptions: {
        poll: true,
    }
}

if (process.argv.some(arg => arg === "--dev")) {
    config.entry.unshift('webpack-hot-middleware/client');
    config.plugins.unshift(new webpack.HotModuleReplacementPlugin(), new webpack.NoErrorsPlugin())
}

if (process.env.NODE_ENV === "production")
{
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
        }
    }))
}

module.exports = config;