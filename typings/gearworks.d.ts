declare module "gearworks"
{
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
    
    export interface User
    {        
        _id: string;

        _rev?: string;

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