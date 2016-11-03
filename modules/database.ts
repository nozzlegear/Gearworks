import { wrap } from "boom";
import { stringify as qs } from "qs";
import fetch, { Response } from "node-fetch";
import { COUCHDB_URL } from "../modules/constants";
import { User, PasswordResetUser, Database } from "gearworks";

const UsersDatabaseInfo = {
    name: "gearworks_users",
    indexes: ["shopify_access_token", "password_reset_token", "shop_id"]
};

export default async function configureDatabases() {
    const dbInfo = await fetch(COUCHDB_URL, { method: "GET" });

    if (!dbInfo.ok) {
        throw new Error(`Failed to connect to CouchDB instance at ${COUCHDB_URL}. ${dbInfo.status} ${dbInfo.statusText} ${await dbInfo.text()}`);
    }

    const infoBody = await dbInfo.json();
    const version = parseInt(infoBody.version);

    if (version < 2) {
        console.warn(`Warning: Gearworks expects your CouchDB instance to be running CouchDB 2.0 or higher. Version detected: ${version}. Some database methods may not work.`)
    }

    [UsersDatabaseInfo].forEach(async db => {
        try {
            const result = await fetch(`${COUCHDB_URL}/${db.name}`, { method: "PUT" });

            if (!result.ok && result.status !== 412 /* Precondition Failed - Database already exists. */) {
                const body = await result.text();

                throw new Error(`${result.status} ${result.statusText} ${body}`);
            }
        } catch (e) {
            console.error(`Error creating database ${db.name}`, e);

            return;
        }

        try {
            const result = await fetch(`${COUCHDB_URL}/${db.name}/_index`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    index: {
                        fields: db.indexes
                    },
                    name: `${db.name}-indexes`,
                })
            });

            if (!result.ok) {
                const body = await result.text();
                
                throw new Error(`${result.status} ${result.statusText} ${body}`);
            }
        } catch (e) {
            console.error(`Error creating indexes (${db.indexes}) on database ${db.name}`, e);
        }
    });
}

function prepDatabase<T>(name: string) {
    const databaseUrl = `${COUCHDB_URL}/${name}/`;
    async function checkErrorAndGetBody(result: Response, action: "finding" | "listing" | "counting" | "getting" | "posting" | "putting" | "deleting") {
        const body = await result.json();

        if (!result.ok) {
            const message = `Error ${action} document(s) for CouchDB database ${name} at ${result.url}. ${result.status} ${result.statusText}`;

            console.error(message, body)

            throw wrap(new Error(message), result.status, message);
        }

        return body;
    };

    const output: Database<T> = {
        find: async function (selector) {
            const result = await fetch(`${databaseUrl}/_find`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(selector)
            });

            const body = await checkErrorAndGetBody(result, "finding");

            if (body.warning) {
                console.warn(body.warning);
            }

            return body.docs;
        },
        list: async function (options = {}) {
            const query = qs(Object.assign({include_docs: true}, options));
            const url = databaseUrl + (options.view ? `_design/list/_view/${options.view}` : `_all_docs`);
            const result = await fetch(`${url}?${query}`, {
                method: "GET",
            });

            const body = await checkErrorAndGetBody(result, "listing");

            return { offset: body.offset, rows: body.rows.map((r: { id: string, key: string, value: { rev: string }, doc: T }) => r.doc), total_rows: body.total_rows };
        },
        count: async function () {
            const result = await fetch(databaseUrl + `_all_docs`, {
                method: "GET",
            });

            const body = await checkErrorAndGetBody(result, "counting");

            return body.total_rows;
        },
        get: async function (id, rev?) {
            const result = await fetch(databaseUrl + id + "?" + qs({ rev }), {
                method: "GET",
            });

            const body = await checkErrorAndGetBody(result, "getting");

            return body;
        },
        post: async function (data) {
            const result = await fetch(databaseUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const body = await checkErrorAndGetBody(result, "posting");

            return body;
        },
        put: async function (data, rev?) {
            const result = await fetch(databaseUrl + data._id + `?${qs({rev})}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const body = await checkErrorAndGetBody(result, "putting");

            return body;
        },
        delete: async function (id, rev) {
            const result = await fetch(databaseUrl + id + `?${qs({rev})}`, {
                method: "DELETE",
            });

            await checkErrorAndGetBody(result, "deleting");
        }
    };

    return output;
}

export const users = prepDatabase<User>(UsersDatabaseInfo.name);