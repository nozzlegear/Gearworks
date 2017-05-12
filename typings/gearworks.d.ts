declare module "gearworks" {
    import { Enums } from "shopify-prime/dist";
    import { CouchDoc } from "davenport";

    export interface User extends CouchDoc {
        /**
         * The user's id.
         */
        _id?: string;

        /**
         * CouchDB revision.
         */
        _rev?: string;

        /**
         * The date the user's account was created.
         */
        date_created?: string;

        /**
         * The user's hashed password.
         */
        hashed_password?: string;

        /**
         * An access token for the user's store.
         */
        shopify_access_token?: string;

        /**
         * The user's Shopify shop domain.
         */
        shopify_domain?: string;

        /**
         * The name of the user's Shopify shop.
         */
        shopify_shop_name?: string;

        /**
         * The id of the user's Shopify shop.
         */
        shopify_shop_id?: number;

        /**
         * The user's permissions.
         */
        permissions?: Enums.AuthScope[];

        /**
         * The user's plan id.
         */
        plan_id?: string;

        /**
         * The user's Shopify charge id.
         */
        charge_id?: number;
    }

    export interface Plan {
        /**
         * A plan's unique id.
         */
        id: string;

        name: string;

        price: number;

        trialDays: number;

        /**
         * A humanized description that will be displayed on the pricing page.
         */
        description: string;

        /**
         * A custom list of in-app permissions available to this plan.
         */
        permissions: string[];
    }
}