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
}