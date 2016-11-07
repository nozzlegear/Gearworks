import * as Bluebird from "bluebird";
import { COUCHDB_URL } from "./constants"; 
import { Client, CachePolicy, CachedItem, CacheClient } from "catbox";
const CatboxMemory = require("catbox-memory");

export const DefaultTTL = 60 * 60 * 1000; //60 minutes in milliseconds

export type CacheNames = "users";

const Caches: {[index: string]: CacheClient} = {
    users: undefined as CacheClient
}

/**
 * Registers server caches.
 */
export default async function registerCaches() {
    Object.getOwnPropertyNames(Caches).forEach(cacheName => {
        const client = Caches[cacheName] = new Client(CatboxMemory, {});

        client.start(async (error) => {
            if (error) {
                console.error("Error starting cache client", error);

                throw error;
            }
        })
    });
}

/**
 * A promised function for getting a value from a catbox cache.
 */
export function getCacheValue<T>(cacheName: CacheNames, key: string) {
    return new Promise<CachedItem<T>>((resolve, reject) => {
        const client = Caches[cacheName];

        if (!client) {
            throw new Error(`Cache ${cacheName} does not exist or is not initialized.`);
        }

        client.get<T>({ id: key }, (error, value) => {
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
export function setCacheValue<T>(cacheName: CacheNames, key: string, value: T, ttl: number = DefaultTTL) {
    return new Promise<void>((resolve, reject) => {
        const client = Caches[cacheName];

        if (!client) {
            throw new Error(`Cache ${cacheName} does not exist or is not initialized.`);
        }

        client.set({ id: key }, value, ttl, (error) => {
            if (error) {
                return reject(error);
            }

            return resolve(undefined);
        })
    })
}

/**
 * A promised function for deleting a value in a catbox cache.
 */
export function deleteCacheValue<T>(cacheName: CacheNames, key: string) {
    return new Promise<void>((resolve, reject) => {
        const client = Caches[cacheName];

        if (!client) {
            throw new Error(`Cache ${cacheName} does not exist or is not initialized.`);
        }

        client.drop({ id: key }, (error) => {
            if (error) {
                return reject(error);
            }

            return resolve(undefined);
        });
    })
}