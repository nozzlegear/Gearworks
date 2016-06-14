/// <reference path="../typings.d.ts" />

declare module "gearworks"
{
    import * as pouch from "pouchdb";
    import {CachePolicy, CacheOptions, CacheClient} from "catbox";
    import {
        Server as HapiServer, 
        Request as HapiRequest,
        ICatBoxCacheOptions,
        ServerCache
    } from "hapi";
    
    export interface CacheConfig{
        segment: string;
        defaultTTL: number;
        client: CacheClient;
    }
    
    export interface Server extends HapiServer
    {
        app: ServerApp;
        cache: ServerCache;
    }
    
    export interface Request extends HapiRequest
    {
		auth: {
			/** true is the request has been successfully authenticated, otherwise false.*/
			isAuthenticated: boolean;
			/**  the credential object received during the authentication process. The presence of an object does not mean successful authentication.  can be set in the validate function's callback.*/
			credentials: AuthCredentials;
			/**  an artifact object received from the authentication strategy and used in authentication-related actions.*/
			artifacts: AuthArtifacts;
			/**  the route authentication mode.*/
			mode: any;
			/** the authentication error is failed and mode set to 'try'.*/
			error: any;
		};
    }
    
    export interface ServerApp
    {
        isLive: boolean;
        rootDir: string;
        appName: string;
    }
    
    export interface DefaultContext
    {
        appName?: string;
        
        isLive?: boolean;

        user?: {
            userId: string | number;
            username: string;
            isAuthenticated: boolean;
        }

        /**
         * A Crumb string value that must be included on all submitted forms as an input with the name of 'crumb'.
         */
        crumb?: string;
    }
    
    export interface AuthCredentials
    {
        username: string;
        userId: string;
    }
    
    export interface AuthArtifacts
    {
        shopName: string;
        shopDomain: string;
        shopToken: string;
        shopId: number;
        chargeId: number;
        planId: string;
    }
    
    export interface Plan
    {
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
    
    export interface User extends pouch.api.methods.ExistingDoc
    {        
        /**
         * The user's username or email address.
         */
        username: string;
        
        /**
         * The user's hashed password.
         */
        hashedPassword: string;
        
        /**
         * An access token for the user's store.
         */
        shopifyAccessToken?: string;
        
        /**
         * The user's Shopify shop domain.
         */
        shopifyDomain?: string;
        
        /**
         * The name of the user's Shopify shop.
         */
        shopifyShopName?: string;

        /**
         * The id of the user's Shopify shop.
         */
        shopifyShopId?: number;
        
        /**
         * The user's plan id.
         */
        planId?: string;

        /**
         * The user's Shopify charge id.
         */
        chargeId?: number;
    }

    /**
     * A user instance for users that have requested a password reset.
     */
    export interface PasswordResetUser extends User
    {
        passwordResetToken: string;

        passwordResetRequestedAt: Date | string;
    }
    
    export interface AuthCookie  
    {
        userId: string;
        username: string;
        encryptionSignature: string;
    }
}