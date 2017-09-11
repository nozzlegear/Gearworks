import * as process from 'process';
import inspect from 'logspect';
import IS_BROWSER from 'is-in-browser';
import { Enums } from 'shopify-prime';
import { resolve } from 'path';
import { snakeCase } from 'lodash';
import { User } from 'app';
import { v4 as guid } from 'node-uuid';

// NODE_ENV is injected by webpack for the browser client.
declare const NODE_ENV: string;

const env = process && process.env || {};

export const APP_NAME = "Gearworks";

export const SNAKED_APP_NAME = "gearworks".toLowerCase();

function envVar(key: string): string {
    const snakedAppName = SNAKED_APP_NAME.toUpperCase();
    const snakedKey = snakeCase(key).toUpperCase();

    return env[`${snakedAppName}_${snakedKey}`] || env[snakedKey];
}

function envVarDefault(key: string, defaultValue: string): string {
    return envVar(key) || defaultValue;
}

function envVarRequired(key: string): string {
    const value = envVar(key);

    if (!value) {
        throw new Error(`Required environment variable "${key}" was not found.`)
    }

    return value;
}

export const IS_WEBPACK = process && process.mainModule && /webpack.js$/.test(process.mainModule.filename) && process.argv.find(arg => /webpack/.test(arg))

export const COUCHDB_URL = envVarDefault("COUCHDB_URL", "http://localhost:5984");

export const JWT_SECRET_KEY = (IS_WEBPACK || IS_BROWSER) ? undefined : envVarRequired("JWT_SECRET_KEY");

export const IRON_PASSWORD = (IS_WEBPACK || IS_BROWSER) ? undefined : envVarRequired("IRON_PASSWORD");

export const EMAIL_DOMAIN: string = (IS_WEBPACK || IS_BROWSER) ? undefined : envVarRequired("EMAIL_DOMAIN");

export const SPARKPOST_API_KEY = (IS_WEBPACK || IS_BROWSER) ? undefined : envVarRequired("SPARKPOST_API_KEY");

export const SHOPIFY_API_KEY = (IS_WEBPACK || IS_BROWSER) ? undefined : envVarRequired("SHOPIFY_API_KEY");

export const SHOPIFY_SECRET_KEY = (IS_WEBPACK || IS_BROWSER) ? undefined : envVarRequired("SHOPIFY_SECRET_KEY");

export const ISLIVE = env.NODE_ENV === "production";

export const AUTH_HEADER_NAME = "x-gearworks-token";

export const CACHE_SEGMENT_AUTH = "auth-invalidation";

/**
 * A list of Shopify authorization scopes that will be requested from the user during app installation.
 */
export const DEFAULT_SCOPES: Enums.AuthScope[] = ["read_orders", "write_orders"];

/**
 * A list of properties on a user or sessiontoken object that will be automatically sealed and unsealed by Iron.
 */
export const SEALABLE_USER_PROPERTIES: (keyof User)[] = ["shopify_access_token"];