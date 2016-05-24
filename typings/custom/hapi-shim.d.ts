/// <reference path="./../typings.d.ts" />

declare module "hapi"
{
    import * as stream from "stream";
    
    export interface Request
    {
        generateResponse(): IReply;
        generateResponse(source: IReply, options?: any): IReply;
    }
    
    export interface IReply 
    {
        <T>(err: Error | Boom.BoomError, result?: string | number | boolean | Buffer | stream.Stream | IPromise<T> | T, credentialData?: any): IBoom;
    }
    
    export interface Cache
    {
        
        
        set(key: string | number, value: any, ttl: number, callback: (error: Error) => void);
        
        
    }
    
    export interface CacheOptions
    {
        /**
         * String segment name, used to isolate cached items within the cache partition.
         */
        segment: string;
        
        /**
         * Relative expiration expressed in the number of milliseconds since the item was saved in the cache.
         *  Cannot be used together with expiresAt. 
         */
        expiresIn?: number;
        
        /**
         * Time of day expressed in 24h notation using the 'HH:MM' format, at which point all cache records expire. Uses local time. 
         * Cannot be used together with expiresIn.
         */
        expiresAt?: number;
        
        /**
         * A function used to generate a new cache item if one is not found in the cache when calling get()
         */
        generateFunc: (id: string | Object, next: (err, value, ttl) => void) => void;
        
        /**
         * Number of milliseconds to mark an item stored in cache as stale and attempt to regenerate it when generateFunc is provided. 
         * Must be less than expiresIn.
         */
        staleIn?: number;
        
        /**
         * Number of milliseconds to wait before checking if an item is stale.
         */
        staleTimeout?: number;
        
        /**
         * Number of milliseconds to wait before returning a timeout error when the generateFunc function takes too long to return a value. 
         * When the value is eventually returned, it is stored in the cache for future requests.
         */
        generateTimeout?: number;
        
        /**
         * If false, an upstream cache read error will stop the cache.get() method from calling the generate function and will instead pass 
         * back the cache error. Defaults to true.
         */
        generateOnReadError?: boolean;
        
        /**
         * If false, an upstream cache write error when calling cache.get() will be passed back with the generated value when calling. Defaults to true.
         */
        generateIgnoreWriteError?: boolean;
        
        /**
         * Number of milliseconds while generateFunc call is in progress for a given id, before a subsequent generateFunc call is allowed. Defaults to 0 
           (no blocking of concurrent generateFunc calls beyond staleTimeout).
         */
        pendingGenerateTimeout?: number;
        
        /**
         * The cache name configured in server.cache. Defaults to the default cache.
         */
        cache?: string;
        
        /**
         * If true, allows multiple cache provisions to share the same segment. Default to false.
         */
        shared?: boolean;
    }
    
    export interface Server
    {
        cache(CacheOptions): Cache;
    }
}