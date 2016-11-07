declare module "gearworks" {
    import { Schema } from "joi";
    import { Request, Response, NextFunction } from "express";

    //#region Routing

    export interface RouterRequest extends Request {
        user?: User;
        validatedBody?: any;
        validatedQuery?: any;
        validatedParams?: any;
        domainWithProtocol: string;
    }

    export type WithSessionTokenFunction = (user: User, expInDays?: number) => Promise<RouterResponse>;

    export interface RouterResponse extends Response {
        withSessionToken: WithSessionTokenFunction;
    }

    export interface RouterFunctionConfig {
        method: "get" | "post" | "put" | "delete" | "options" | "head",
        path: string,
        handler: (req: RouterRequest, res: RouterResponse, next: NextFunction) => void | any,
        requireAuth?: boolean,
        bodyValidation?: Schema,
        queryValidation?: Schema,
        paramValidation?: Schema,
        validateShopifyRequest?: boolean;
        validateShopifyWebhook?: boolean;
        validateShopifyProxyPage?: boolean;
    }

    export type RouterFunction = (config: RouterFunctionConfig) => void;

    //#endregion

    //#region Database

    export interface Database<T> {
        list: (options?: ListOptions) => Promise<{ offset: number, total_rows: number, rows: T[] }>;
        count: () => Promise<number>;
        get: (id: string, rev?: string) => Promise<T>;
        post: (data: T) => Promise<T>;
        put: (data: T & {_id?: string }, rev?: string) => Promise<T>;
        delete: (id: string, rev: string) => Promise<void>;
        find: (selector: FindSelector) => Promise<T[]>;
    }

    export interface CouchResponse {
        ok: boolean;
        id: string;
        rev: string;
    }

    export interface FindSelector {
        fields?: string[];
        sort?: Object[];
        limit?: number;
        skip?: number;
        use_index?: Object;
        selector: Object;
    }

    /**
     * Options for listing database results.
     */
    export interface ListOptions {
        limit?: number; 
        skip?: number; 
        view?: string;
        descending?: boolean
    }

    //#endregion

    //#region Users

    export type UserPermission = "all";

    export interface User {
        /**
         * The user's id.
         */
        _id?: string;

        /**
         * CouchDB revision.
         */
        _rev?: string;

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
         * The user's plan id.
         */
        plan_id?: string;

        /**
         * The user's Shopify charge id.
         */
        charge_id?: number;

        /**
         * The user's permissions.
         */
        permissions?: UserPermission[];
    }

    export interface SessionToken extends User {
        exp: number;
    }

    //#endregion

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

    /**
     * A user instance for users that have requested a password reset.
     */
    export interface PasswordResetUser extends User {
        passwordResetToken: string;

        passwordResetRequestedAt: Date | string;
    }
}