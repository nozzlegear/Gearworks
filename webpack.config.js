"use strict";

// Hack for Ubuntu on Windows: interface enumeration fails with EINVAL, so return empty.
try {
  require('os').networkInterfaces()
} 
catch (e) {
  require('os').networkInterfaces = () => ({})
}

const webpack      = require("webpack");
const pkg          = require("./package.json");
const process      = require("process");
const path         = require("path");
const dev          = process.argv.some(arg => arg === "--dev");

const config = {
    entry: {
        "client": "./bin/client.js",
    },
    output: {
        path: path.join(__dirname, "dist"),
        // Important: publicPath must begin with a / but must not end with one. Else hot module replacement won't find updates.
        publicPath: "/dist", 
        filename: "[name].js",
    },
    watchOptions: {
        poll: true
    },
    plugins: [
        dev ? new webpack.HotModuleReplacementPlugin() : undefined, 
        dev ? new webpack.NoErrorsPlugin() : undefined,
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.DefinePlugin({
            "_VERSION": `"${pkg.version}"`,
            "NODE_ENV": `"${process.env.NODE_ENV}"` || `"development"`,
        })
    ].filter(arg => !!arg),
}

module.exports = config;