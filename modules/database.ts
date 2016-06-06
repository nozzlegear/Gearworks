/// <reference path="./../typings/typings.d.ts" />

import pouch = require("pouchdb");

export const DatabaseUrl: string = process.env.couchUrl;
export const users = new pouch(`${DatabaseUrl}/users`);
