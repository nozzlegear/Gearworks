import Davenport, { configureDatabase, DatabaseConfiguration, GENERIC_LIST_VIEW } from 'davenport';
import inspect from 'logspect';
import { COUCHDB_URL, SNAKED_APP_NAME } from '../../shared/constants';
import { User } from 'app';

class UserDbFactory extends Davenport<User> {
    constructor() {
        super(COUCHDB_URL, UserDbFactory.Config.name, { warnings: false });
    }

    static get Config(): DatabaseConfiguration<User> {
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

    get Config(): DatabaseConfiguration<User> {
        return UserDbFactory.Config
    }
}

export const UserDb = new UserDbFactory();