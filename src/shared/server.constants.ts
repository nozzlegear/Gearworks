import { Enums } from 'shopify-prime';
import { envVarDefault, envVarRequired } from './constants';
import { User } from 'app';

/**
 * This file contains constants and environment variables that should *never* be used in the browser due to
 * their extremely sensitive nature (.e.g secret API keys) or simply because the browser doesn't need them.
 */

export const JWT_SECRET_KEY = envVarRequired("JWT_SECRET_KEY");

export const IRON_PASSWORD = envVarRequired("IRON_PASSWORD");

export const EMAIL_DOMAIN: string = envVarRequired("EMAIL_DOMAIN");

export const SPARKPOST_API_KEY = envVarRequired("SPARKPOST_API_KEY");

export const SHOPIFY_API_KEY = envVarRequired("SHOPIFY_API_KEY");

export const SHOPIFY_SECRET_KEY = envVarRequired("SHOPIFY_SECRET_KEY");

export const COUCHDB_URL = envVarDefault("COUCHDB_URL", "http://localhost:5984");

export const CACHE_SEGMENT_AUTH = "auth-invalidation";

/**
 * A list of Shopify authorization scopes that will be requested from the user during app installation.
 */
export const DEFAULT_SCOPES: Enums.AuthScope[] = ["read_orders", "write_orders"];

/**
 * A list of properties on a user or sessiontoken object that will be automatically sealed and unsealed by Iron.
 */
export const SEALABLE_USER_PROPERTIES: (keyof User)[] = ["shopify_access_token"];