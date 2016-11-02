declare module "catbox"
{
    export const Client: CacheClient & {new (engine: any, engineOptions: Object): CacheClient};
    
    interface Cache
    {
        /**
         * Retrieve an item from the cache. If the item is not found and the generateFunc method was provided, a new value is generated, stored in the cache, and returned. Multiple concurrent requests are queued and processed once.
         */
        get<T>(key: CacheKey, callback: (err: any, item?: CachedItem<T>) => void): void;
        
        /**
         * Store an item in the cache.
         */
        set<T>(key: CacheKey, value: T, ttl: number, callback: (error: any) => void);
        
        /**
         * Remove the item from cache.
         */
        drop(key: CacheKey, callback: (err: any) => void): void;
        
        /**
         * Returns true if cache engine determines itself as ready, false if it is not ready or if there is no cache engine set.
         */
        isReady(): boolean;
    }
    
    export interface CacheClient extends Cache
    {
        start(callback: (err: any) => void): void;
        
        stop(): void;
    }
    
    export interface CachePolicy extends Cache
    {
        /**
         * Given a created timestamp in milliseconds, returns the time-to-live left based on the configured rules
         */
        ttl(created: number): number;
        
        /**
         * Changes the policy rules after construction (note that items already stored will not be affected)
         */
        rules(options: CacheOptions): void;
        
        /**
         * An object with cache statistics where: 
         */
        stats: CacheStats;
    }
    
    export interface CacheStats
    {
        /**
         * Number of cache writes.
         */
        sets: number;
        
        /**
         * Number of cache get() requests.
         */
        gets: number;
        
        /**
         * Number of cache get() requests in which the requested id was found in the cache (can be stale).
         */
        hits: number;
        
        /**
         * Number of cache reads with stale requests (only counts the first request in a queued get() operation).
         */
        stales: number;
        
        /**
         * Number of calls to the generate function.
         */
        generates: number;
        
        /**
         * cache operations errors.
         */
        errors: number;
    }
    
    export interface CacheReport
    {
        /**
         * The cache lookup time in milliseconds.
         */
        msec: number;
        
        /**
         * The timestamp when the item was stored in the cache.
         */
        stored: number;
        
        /**
         * True if the item is stale.
         */
        isStale: boolean;
        
        /**
         * The cache ttl value for the record.
         */
        ttl: number;
        
        /**
         * Lookup error.
         */
        error: any;
    }
    
    export interface CachedItem<T>
    {
        /**
         * The item's value.
         */
        item: T;
        
        /**
         * The timestamp when the item was stored in the cache (in milliseconds).
         */
        stored: number;
        
        /**
         * The remaining time-to-live (not the original value used when storing the object).
         */
        ttl: number;
    }
    
    export interface CacheKey
    {
        id: string;
        
        segment?: string;
    }
    
    export interface CacheOptions
    {
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
        generateFunc?: (id: string | Object, next: (err, value, ttl) => void) => void;
        
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
         * The name of the cache.
         */
        name?: string;
        
        /**
         * If true, allows multiple cache provisions to share the same segment. Default to false.
         */
        shared?: boolean;
    }

    export interface CachePolicyOptions extends CacheOptions
    {
        /**
         * String segment name, used to isolate cached items within the cache partition.
         */
        segment: string;
        
        /**
         * The name of the cache to use, set with server.cache.provision.
         */
        cache?: string;
    }
    
    export interface CacheProvisionOptions extends CacheOptions
    {
        /**
         * The cache engine to use, e.g. require("catbox-memory") or require("catbox-couchbase")
         */
        engine: any;
        
        /**
         * A name for the provisioned cache, which can be used when creating a cache client with server.cache({name: name});
         */
        name: string;
    }
}