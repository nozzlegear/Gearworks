
const env: {[index: string]: string} = process.env;

export const OptionalProps = [
    "Port",
    "Host",
    "StripePublishableKey",
    "StripeSecretKey",
    "SparkpostKey",
    "EmailDomain",
]

/**
 * A salt encryption string for Yar cookies.
 */
export const YarSalt: string = env["gearworks-yarSalt"] || env["yarSalt"];

/**
 * A random encryption signature string
 */
export const EncryptionSignature = env["gearworks-encryptionSignature"] || env["encryptionSignature"];

/**
 * The connection URL to your PouchDB-compatible database.
 */
export const DatabaseUrl: string = env["gearworks-couchUrl"] || env["couchUrl"];

/**
 * Your server app's port. Typically set automatically by your host with the PORT environment variable.
 */
export const Port = env["gearworks-port"] || env["PORT"];

/**
 * Your server app's host domain. Typically set automatically by your host with the HOST environment variable.
 */
export const Host = env["gearworks-host"] || env["HOST"];

/**
 * Your app's full domain, e.g. example.com or www.example.com.
 */
export const Domain = env["gearworks-domain"] || env["domain"]

/**
 * Your app's name.
 */
export const AppName = env["gearworks-appName"] || env["appName"];

/**
 * Your Shopify app's secret key.
 */
export const ShopifySecretKey = env["gearworks-shopifySecretKey"] || env["shopifySecretKey"];

/**
 * Your Shopify app's public API key.
 */
export const ShopifyApiKey = env["gearworks-shopifyApiKey"] || env["shopifyApiKey"];

/**
 * Optional. Your Stripe publishable key.
 */
export const StripePublishableKey = env["gearworks-stripePublishableKey"] || env["stripePublishableKey"];

/**
 * Optional. Your Stripe secret key.
 */
export const StripeSecretKey = env["gearworks-stripeSecretKey"] || env["stripeSecretKey"];

/**
 * Optional. Your Sparkpost (https://www.sparkpost.com) API key, used for sending password reset emails.
 */
export const SparkpostKey = env["gearworks-sparkpostKey"] || env["sparkpostKey"];

/**
 * Optional. The domain to send emails from, e.g. example.com. Domain must be verified in your Sparkpost account.
 */
export const EmailDomain = env["gearworks-emailDomain"] || env["emailDomain"];