/// <reference path="./../typings/typings.d.ts" />

import pouch = require("pouchdb");
import {User} from "gearworks";

// Add the pouchdb-find plugin
pouch.plugin(require("pouchdb-find"));

export const DatabaseUrl: string = process.env.couchUrl;
export const users = new pouch(`${DatabaseUrl}/users`);

/**
 * Finds a user by their Shop Id.
 */
export async function findUserByShopId(shopId: number): Promise<User>
{
    // Don't search for null, undefined or NaN values
    if (!shopId)
    {
        return undefined;
    }

    await users.createIndex({
        index: {
            fields: ["shopifyShopId"]
        }
    });

    const result = await users.find<User>({
        selector: {
            shopifyShopId: shopId,
        },
        limit: 1,
    });

    return result.docs.length > 0 ? result.docs[0] : undefined;
}