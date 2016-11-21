import { resolve } from "path";
import { Enums } from "shopify-prime";

// NODE_ENV is injected by webpack for the browser client.
declare const NODE_ENV: string;

const env = process && process.env || {};
let isBrowser = true;

if (typeof process === 'object' && process + '' === '[object process]') {
    isBrowser = false;
}

export const COUCHDB_URL = env.GEARWORKS_COUCHDB_URL || env.COUCHDB_URL || "http://localhost:5984";

export const ISLIVE = env.NODE_ENV === "production" || (isBrowser && NODE_ENV === "production");

export const AUTH_HEADER_NAME = "x-gearworks-token";

export const JWT_SECRET_KEY = env.GEARWORKS_JWT_SECRET_KEY || env.JWT_SECRET_KEY;

export const IRON_PASSWORD = env.GEARWORKS_IRON_PASSWORD || env.IRON_PASSWORD;

export const EMAIL_DOMAIN = env.GEARWORKS_EMAIL_DOMAIN || env.EMAIL_DOMAIN;

export const APP_NAME = env.GEARWORKS_APP_NAME || env.APP_NAME || "Gearworks";

export const SPARKPOST_API_KEY = env.GEARWORKS_SPARKPOST_API_KEY || env.SPARKPOST_API_KEY;

export const SHOPIFY_API_KEY = env.GEARWORKS_SHOPIFY_API_KEY || env.SHOPIFY_API_KEY;

export const SHOPIFY_SECRET_KEY = env.GEARWORKS_SHOPIFY_SECRET_KEY || env.SHOPIFY_SECRET_KEY;

/**
 * A list of Shopify authorization scopes that will be requested from the user during app installation.
 */
export const DEFAULT_SCOPES: Enums.AuthScope[] = ["read_orders", "write_orders"];

/**
 * A list of properties on a user or sessiontoken object that will be automatically sealed and unsealed by Iron.
 */
export const SEALABLE_USER_PROPERTIES = ["shopify_access_token"];

if (!isBrowser) {
    if (!JWT_SECRET_KEY) {
        console.warn("Warning: JWT_SECRET_KEY was not found in environment variables. Session authorization will be unsecure and may exhibit unwanted behavior.");
    }

    if (!IRON_PASSWORD) {
        console.warn("Warning: IRON_PASSWORD was not found in environment variables. Session authorization will be unsecure and may exhibit unwanted behavior.");
    }

    if (!SHOPIFY_API_KEY) {
        console.warn("Warning: SHOPIFY_API_KEY was not found in environment variables. Shopify integration will be impossible.");
    }

    if (!SHOPIFY_SECRET_KEY) {
        console.warn("Warning: SHOPIFY_SECRET_KEY was not found in environment variables. Shopify integration will be impossible.");
    }

    if (!EMAIL_DOMAIN) {
        console.warn("Warning: EMAIL_DOMAIN was not found in environment varialbes. Password reset will be impossible.")
    }

    if (!SPARKPOST_API_KEY) {
        console.warn("Warning: SPARKPOST_API_KEY was not found in environment variables. Password reset will be impossible.");
    }
}