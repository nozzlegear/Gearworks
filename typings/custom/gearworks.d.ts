declare module "gearworks"
{
    import {Server as HapiServer} from "hapi";
    import * as pouch from "pouchdb";
    
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
        
        interval: "month" | "year";
        
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
        shopifyShop?: string;
        
        /**
         * The user's plan id.
         */
        planId?: string;
    }
}