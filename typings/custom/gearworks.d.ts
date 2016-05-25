declare module "gearworks"
{
    import {Server as HapiServer} from "hapi";
    
    export interface Server extends HapiServer
    {
        app: ServerApp;
    }
    
    export interface ServerApp
    {
        isLive: boolean;
        rootDir: string;
        "appName": string;
        "shopifyApiKey": string;
        "shopifySecretKey": string;
        "stripeSecretKey": string;
        "stripePublishableKey": string;
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
    }
    
    export interface User
    {
        id: string | number;
        
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
        shopifyShop?: string;
    }
}