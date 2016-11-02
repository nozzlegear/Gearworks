/// <reference path="./../typings/typings.d.ts" />

import pouch = require("pouchdb");
import {DatabaseUrl} from "./config";
import {User, PasswordResetUser} from "gearworks";

// Add the pouchdb-find plugin
pouch.plugin(require("pouchdb-find"));

export const Users = new pouch(`${DatabaseUrl}/users`);

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

    await Users.createIndex({
        index: {
            fields: ["shopifyShopId"]
        }
    });

    const result = await Users.find<User>({
        selector: {
            shopifyShopId: shopId,
        },
        limit: 1,
    });

    return result.docs.length > 0 ? result.docs[0] : undefined;
}

/**
 * Finds a user by their `passwordResetToken`.
 */
export async function findUserByPasswordResetToken(token: string): Promise<PasswordResetUser>
{
    // Don't search for null values
    if (typeof token !== "string")
    {
        return undefined;
    }

    await Users.createIndex({
        index: {
            fields: ["passwordResetToken"]
        }
    });

    const result = await Users.find<PasswordResetUser>({
        selector: {
            passwordResetToken: token
        },
        limit: 1,
    });

    return result.docs.length > 0 ? result.docs[0] : undefined;
}