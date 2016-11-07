import { resolve } from "path";
const env = process.env || {};
const pkg = require(resolve(__dirname, "../../", "package.json"));

export const COUCHDB_URL = env.GEARWORKS_COUCHDB_URL || env.COUCHDB_URL || "http://localhost:5984";

export const VERSION = pkg.version;

export const AUTH_HEADER_NAME = "x-gearworks-token";

export const JWT_SECRET_KEY = env.GEARWORKS_JWT_SECRET_KEY || env.JWT_SECRET_KEY;

export const IRON_PASSWORD = env.GEARWORKS_IRON_PASSWORD || env.IRON_PASSWORD;

/**
 * A list of properties on a user or sessiontoken object that will be automatically sealed and unsealed by Iron.
 */
export const SEALABLE_USER_PROPERTIES = ["shopify_access_token"];

if (!JWT_SECRET_KEY) {
    console.warn("Warning: JWT_SECRET_KEY was not found in environment variables. Session authorization will be unsecure and may exhibit unwanted behavior.");
}

if (!IRON_PASSWORD) {
console.warn("Warning: IRON_PASSWORD was not found in environment variables. Session authorization will be unsecure and may exhibit unwanted behavior.");
}