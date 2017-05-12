import * as Bluebird from 'bluebird';
import Davenport, { configureDatabase, DatabaseConfiguration, GENERIC_LIST_VIEW } from 'davenport';
import inspect from 'logspect';
import { COUCHDB_URL, SNAKED_APP_NAME } from '../modules/constants';
import { User } from 'gearworks';

declare const emit: any;

export default async function configure() {
    const databases: DatabaseConfiguration<any>[] = [
        UserDbFactory.Info
    ];

    await Bluebird.all(databases.map(db => configureDatabase(COUCHDB_URL, db)));
}

export class UserDbFactory extends Davenport<User> {
    constructor() {
        super(COUCHDB_URL, UserDbFactory.Info.name, { warnings: false });
    }

    static get Info(): DatabaseConfiguration<User> {
        return {
            name: `${SNAKED_APP_NAME}_users`,
            indexes: ["shopify_access_token", "shopify_shop_id"],
            designDocs: [
                {
                    name: "list",
                    views: [GENERIC_LIST_VIEW]
                },
            ],
        };
    }
}

export const UserDb = new UserDbFactory();