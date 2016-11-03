import * as Bluebird from "bluebird";
import { COUCHDB_URL } from "./constants";
import { Client, CachePolicy, CachedItem } from "catbox";

export const DefaultTTL = 60 * 60 * 1000; //60 minutes in milliseconds

/**
 * A collection of caches used throughout the app.
 */
export const Caches = {
    /**
     * A cache for storing user data used during auth checks.
     */
    userAuth: {
        segment: "user_auth_data",
        client: undefined,
        defaultTTL: DefaultTTL,
    }
}

/**
 * Registers caches on the server and makes them available on the Caches object.
 */
export default async function registerCaches() {
    Caches.userAuth.client = new Client(require("catbox-memory"), undefined);
    Caches.userAuth.client.start(async (error) => {
        if (error) {
            console.error("Error starting cache client", error);

            throw error;
        }
    })
}

/**
 * A promised function for getting a value from a catbox cache.
 */
export function getCacheValue<T>(cache, key: string) {
    return new Promise<CachedItem<T>>((resolve, reject) => {
        cache.client.get({ id: key, segment: cache.segment }, (error, value) => {
            if (error) {
                return reject(error);
            }

            return resolve(value);
        })
    })
}

/**
 * A promised function for setting a value in a catbox cache.
 */
export function setCacheValue<T>(cache, key: string, value: T) {
    return new Promise<void>((resolve, reject) => {
        cache.client.set({ id: key, segment: cache.segment }, value, cache.defaultTTL, (error) => {
            if (error) {
                reject(error);
            }

            resolve(undefined);
        })
    })
}

/**
 * A promised function for deleting a value in a catbox cache.
 */
export function deleteCacheValue<T>(cache, key: string) {
    return new Promise<void>((resolve, reject) => {
        cache.client.drop({ id: key, segment: cache.segment }, (error) => {
            if (error) {
                reject(error);
            }

            resolve(undefined);
        });
    })
}