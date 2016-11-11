declare module "iron" {
    /**
     * Seals an object, converting it to an Iron token string.
     */
    export function seal(data: any, password: string, options: any, callback: (err: Error, sealedData: string) => void): void;

    /**
     * Unseals an Iron token string, converting it to an object.
     */
    export function unseal<T>(sealedData: string, password: string, options: any, callback: (err: Error, unsealedData: T) => void): void;
    
    export interface Options {
        /**
         * Defines the options used by the encryption process.
         */
        encryption: EncryptionOptions;

        /**
         * Defines the options used by the HMAC integrity verification process.
         */
        integrity: EncryptionOptions;

        /**
         * Sealed object lifetime in milliseconds where 0 means forever. Defaults to 0.
         */
        ttl: number;

        /**
         * Number of seconds of permitted clock skew for incoming expirations. Defaults to 60 seconds.
         */
        timestampSkewSec: number;

        /**
         * Local clock time offset, expressed in number of milliseconds (positive or negative). Defaults to 0.
         */
        localtimeOffsetMsec: number;
    }

    export interface EncryptionOptions {
        /**
         * The size of the salt (random buffer used to ensure that two identical objects will generate a different encrypted result.
         */
        saltBits: number;

        /**
         * The algorithm used ('aes-256-cbc' for encryption and 'sha256' for integrity are the only two supported at this time).
         */
        algorithm: string;

        /**
         * The number of iterations used to derive a key from the password. Set to 1 by default. The number of ideal iterations to use is dependent on your application's performance requirements. More iterations means it takes longer to generate the key.
         */
        iterations: number;
    }

    /**
     * Iron option defaults.
     */
    export const defaults: Options;
}