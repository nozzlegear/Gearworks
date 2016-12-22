import { wrap } from "boom";
import inspect from "logspect";
import isOkay from "./axios_utils";
import { stringify as qs } from "qs";
import Axios, { AxiosResponse } from "axios";
import { snakeCase, isUndefined } from "lodash";
import { COUCHDB_URL, APP_NAME } from "../modules/constants";
import {
    User,
    Database,
    CouchResponse,
    ViewOptions,
    CouchDoc,
    ListResponse,
    CouchDBView,
    DesignDoc,
    AllDocsListResult,
    DatabaseConfiguration,
} from "gearworks";

declare const emit: any;

const defaultListView = {
    "name": "all",
    "map": function (doc) { emit(doc._id, doc); }.toString(),
    "reduce": "_count"
}

const UsersDatabaseInfo: DatabaseConfiguration = {
    name: `${snakeCase(APP_NAME)}_users`,
    indexes: ["shopify_access_token", "password_reset_token", "shop_id"],
    designDocs: [
        {
            name: "list",
            views: [defaultListView]
        },
    ],
};

export default async function configureDatabases() {
    const dbInfo = await Axios.get(COUCHDB_URL);

    if (!isOkay(dbInfo)) {
        throw new Error(`Failed to connect to CouchDB instance at ${COUCHDB_URL}. ${dbInfo.status} ${dbInfo.statusText}`);
    }

    const infoBody = dbInfo.data as { version: string };
    const version = parseInt(infoBody.version);

    if (version < 2) {
        inspect(`Warning: Gearworks expects your CouchDB instance to be running CouchDB 2.0 or higher. Version detected: ${version}. Some database methods may not work.`)
    }

    [UsersDatabaseInfo].forEach(async db => await configureDatabase(db));
}

export async function configureDatabase(db: DatabaseConfiguration) {
    try {
        const result = await Axios.put(`${COUCHDB_URL}/${db.name}`);
        const preconditionFailed = 412; /* Precondition Failed - Database already exists. */

        if (result.status !== preconditionFailed && !isOkay(result)) {
            throw new Error(`${result.status} ${result.statusText} ${result.data}`);
        }
    } catch (e) {
        inspect(`Error creating database ${db.name}`, e);

        return;
    }

    try {
        const data = {
            index: {
                fields: db.indexes
            },
            name: `${db.name}-indexes`,
        };
        const result = await Axios.post(`${COUCHDB_URL}/${db.name}/_index`, data, {
            headers: {
                "Content-Type": "application/json"
            },
        });

        if (!isOkay(result)) {
            throw new Error(`${result.status} ${result.statusText} ${result.data}`);
        }
    } catch (e) {
        console.error(`Error creating indexes (${db.indexes}) on database ${db.name}`, e);
    }

    db.designDocs.forEach(async designDoc => {
        const url = `${COUCHDB_URL}/${db.name}/_design/${designDoc.name}`;
        const getDoc = await Axios.get(url);
        const okay = isOkay(getDoc);
        let docFromDatabase: DesignDoc;

        if (!isOkay && getDoc.status !== 404) {
            inspect(`Failed to retrieve design doc "${designDoc.name}". ${getDoc.status} ${getDoc.statusText}`, getDoc.data);

            return;
        }

        if (!isOkay) {
            docFromDatabase = {
                _id: `_design/${designDoc.name}`,
                language: "javascript",
                views: {}
            }
        } else {
            docFromDatabase = getDoc.data;
        }

        const docViews = designDoc.views;
        let shouldUpdate = false;

        docViews.forEach(view => {
            if (!docFromDatabase.views || !docFromDatabase.views[view.name] || docFromDatabase.views[view.name].map !== view.map || docFromDatabase.views[view.name].reduce !== view.reduce) {
                docFromDatabase.views = Object.assign({}, docFromDatabase.views, {
                    [view.name]: {
                        map: view.map,
                        reduce: view.reduce,
                    }
                })

                shouldUpdate = true;
            }
        });

        if (shouldUpdate) {
            inspect(`Creating or updating design doc "${designDoc.name}".`);

            const result = await Axios.put(url, docFromDatabase, {
                headers: {
                    "Content-Type": "application/json",
                }
            });

            if (!isOkay(result)) {
                inspect(`Could not put CouchDB design doc "${designDoc.name}". ${result.status} ${result.statusText}`, result.data);
                inspect(docFromDatabase);
            }
        }
    })
}

function prepDatabase<T extends CouchDoc>(name: string) {
    const databaseUrl = `${COUCHDB_URL}/${name}/`;
    async function checkErrorAndGetBody(result: AxiosResponse, action: "finding" | "listing" | "counting" | "getting" | "posting" | "putting" | "deleting" | "copying" | "viewing") {
        if (!isOkay(result)) {
            const message = `Error ${action} document(s) for CouchDB database ${name} at ${result.config.url}. ${result.status} ${result.statusText}`;

            if (result.status !== 404) {
                inspect(message, result.data);
            }

            throw wrap(new Error(message), result.status, message);
        }

        return result.data;
    };

    const output: Database<T> = {
        find: async function (selector) {
            const result = await Axios.post(`${databaseUrl}/_find`, selector, {
                headers: {
                    "Content-Type": "application/json"
                },
            });

            const body = await checkErrorAndGetBody(result, "finding");

            if (body.warning) {
                inspect("CouchDB .find result contained warning:", body.warning);
            }

            return body.docs;
        },
        list: async function (options = {}) {
            const result = await output.view<{ id: string, key: string, value: T }>("list", defaultListView.name, options);

            return {
                offset: result.offset,
                total_rows: result.total_rows,
                rows: result.rows.map(r => r.value)
            }
        },
        count: async function () {
            const result = await output.reducedView<{ key: string, value: number }>("list", defaultListView.name, {
                group: false
            });

            return result.rows.reduce((total, row) => total + row.value, 0);
        },
        get: async function (id, rev?) {
            const result = await Axios.get(databaseUrl + id + "?" + qs({ rev }));
            const body = await checkErrorAndGetBody(result, "getting");

            return body;
        },
        post: async function (data) {
            const result = await Axios.post(databaseUrl, data, {
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const body: CouchResponse = await checkErrorAndGetBody(result, "posting");

            // Post, put and copy requests do not return the object itself. Update the input object with new id and rev values.
            return Object.assign({}, data, { _id: body.id, _rev: body.rev });
        },
        put: async function (id: string, data, rev: string) {
            if (!rev) {
                inspect(`Warning: no revision specified for CouchDB .put function with id ${id}. This may cause a document conflict error.`);
            }

            const result = await Axios.put(databaseUrl + id + `?${qs({ rev })}`, data, {
                headers: {
                    "Content-Type": "application/json"
                },
            });
            const body: CouchResponse = await checkErrorAndGetBody(result, "putting");

            // Post, put and copy requests do not return the object itself. Update the input object with new id and rev values.
            return Object.assign({}, data, { _id: body.id, _rev: body.rev });
        },
        copy: async function (id: string, data, newId) {
            const result = await Axios({
                url: databaseUrl + id,
                method: "COPY",
                headers: {
                    Destination: newId
                },
            });
            const body: CouchResponse = await checkErrorAndGetBody(result, "copying");

            // Post, put and copy requests do not return the object itself. Update the input object with new id and rev values.
            return Object.assign({}, data, { _id: body.id, _rev: body.rev });
        },
        delete: async function (id, rev) {
            if (!rev) {
                inspect(`Warning: no revision specified for CouchDB .delete function with id ${id}. This may cause a document conflict error.`);
            }

            const result = await Axios.delete(databaseUrl + id + `?${qs({ rev })}`);

            await checkErrorAndGetBody(result, "deleting");
        },
        exists: async function (id) {
            const result = await Axios.head(databaseUrl + id);

            return result.status === 200;
        },
        view: async function (designDocName: string, viewName: string, options: ViewOptions = {}) {
            if (options.reduce === true) {
                inspect("CouchDB .reducedView was passed {reduce: true} with its options. This function always sets reduce to false. Consider using CouchDB .reducedView instead.");
            }

            options.reduce = false;

            const result = await Axios.get(`${databaseUrl}_design/${designDocName}/_view/${viewName}`, {
                params: options,
            });
            const body = await checkErrorAndGetBody(result, "viewing");

            return body;
        },
        reducedView: async function (designDocName: string, viewName: string, options: ViewOptions = {}) {
            if (options.reduce === false) {
                inspect("CouchDB .reducedView was passed {reduce: false} with its options. This function always sets reduce to true. Consider using CouchDB .view instead.");
            }

            if (!options.group && isUndefined(options.group_level)) {
                inspect("CouchDB .reducedView is not grouping its results. This may not return the desired result. Consider using {group: true} or {group_level: 1}");
            }

            options.reduce = true;

            const result = await Axios.get(`${databaseUrl}_design/${designDocName}/_view/${viewName}`, {
                params: options
            });
            const body = await checkErrorAndGetBody(result, "viewing");

            return body;
        }
    };

    return output;
}

export const UserDb = prepDatabase<User>(UsersDatabaseInfo.name);