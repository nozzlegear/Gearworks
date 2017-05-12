import * as Bluebird from 'bluebird';
import * as Cache from 'gearworks-cache';
import inspect from 'logspect';
import registerAccounts from './accounts';
import registerIntegrations from './integrations';
import registerSessions from './sessions';
import registerWebhooks from './webhooks';
import routerFactory from 'gearworks-route';
import { Express } from 'express';
import { User } from 'gearworks';
import {
    AUTH_HEADER_NAME,
    JWT_SECRET_KEY,
    SEALABLE_USER_PROPERTIES,
    SHOPIFY_SECRET_KEY,
    IRON_PASSWORD,
    CACHE_SEGMENT_AUTH,
} from '../modules/constants';

// Import routes to register

const routes = [
    registerAccounts,
    registerSessions,
    registerWebhooks,
    registerIntegrations,
]

export default async function registerAllRoutes(app: Express) {
    // Initialize the cache
    await Cache.initialize();

    const router = routerFactory<User>(app, {
        auth_header_name: AUTH_HEADER_NAME,
        iron_password: IRON_PASSWORD,
        jwt_secret_key: JWT_SECRET_KEY,
        sealable_user_props: SEALABLE_USER_PROPERTIES,
        shopify_secret_key: SHOPIFY_SECRET_KEY,
        userAuthIsValid: async (user) => {
            try {
                // If the user exists in the cache then their auth is invalid.
                const cacheValue = await Cache.getValue(CACHE_SEGMENT_AUTH, user._id);

                if (!!cacheValue) {
                    return false;
                }
            } catch (e) {
                inspect(`Error attempting to retrieve ${user._id} value from ${CACHE_SEGMENT_AUTH} cache. Directing user to sign in again.`, e);

                return false;
            }

            return true;
        }
    });

    await Bluebird.all(routes.map(register => register(app, router)));
}