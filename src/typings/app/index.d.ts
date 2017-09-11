declare module "app" {
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

declare module "app/requests/users" {
    export interface NewPassword {
        new_password: string;
    }

    export interface ResetPassword extends NewPassword {
        reset_token: string;
    }

    export interface UpdatePassword extends NewPassword {
        old_password: string;
    }

    export interface ForgotPassword {
        username: string;
    }

    export interface CreateOrUpdateAccount extends ForgotPassword {
        password: string;
    }
}

declare module "app/requests/shopify" {
    export interface GetOauthUrl {
        shop_domain: string;
        redirect_url: string;
    }

    export interface Authorize {
        code: string;
        shop: string;
        hmac: string;
        state: string;
    }

    export interface ListOrders {
        limit: number;
        page: number;
        status: "any";
    }

    export interface CreateOrder {
        city: string;
        email: string;
        line_item: string;
        name: string;
        quantity: number;
        state: string;
        street: string;
        zip: string;
    }

    export interface OpenCloseDelete {
        id: number;
    }
}

declare module "app/requests/sessions" {
    export interface CreateSession {
        username: string;
        password: string;
    }
}

declare module "app/requests/webhooks" {
    export interface AppUninstalled {
        shop_id: string;
        shop: string;
    }
}