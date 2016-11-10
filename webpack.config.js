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
const dev          = process.argv.some(arg => arg === "--dev");

const config = {
    entry: [
        dev ? 'webpack-hot-middleware/client' : undefined,
        "./client/app",
    ].filter(arg => !!arg),
    output: {
        path: path.join(__dirname, "dist"),
        // Important: publicPath must begin with a / but must not end with one. Else hot module replacement won't find updates.
        publicPath: "/dist", 
        filename: "app.js",
    },
    resolve: {
        root:  process.cwd(),
        extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js", ".jsx"],
    },
    externals: { },
    devtool: "source-map",
    plugins: [
        dev ? new webpack.HotModuleReplacementPlugin() : undefined, 
        dev ? new webpack.NoErrorsPlugin() : undefined,
        new lodashPack(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({
            "_VERSION": `"${pkg.version}"`,
            "NODE_ENV": process.env.NODE_ENV || "development",
        })
    ].filter(arg => !!arg),
    module: {
        loaders: [
            { 
                test: /\.tsx?$/i, 
                loaders: [dev ? "react-hot" : undefined, "babel", 'awesome-typescript-loader?useCache=true'].filter(arg => !!arg),
            },
            {
                loaders: [dev ? "react-hot" : undefined, "babel"].filter(arg => !!arg),
                test: /\.jsx?$/i,
                include: path.join(__dirname, 'client')
            },
            {
                test: /\.css$/i,
                loaders: ["style", "css", "postcss-loader"]
            },
            {
                test: /\.styl$/i,
                loaders: ["style", "css", "stylus"]
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
}

if (process.env.NODE_ENV === "production") {
    config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
        }
    }))
}

module.exports = config;