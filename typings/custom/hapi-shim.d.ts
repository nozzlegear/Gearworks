/// <reference path="./../typings.d.ts" />

declare module "hapi"
{
    import * as stream from "stream";
    import {CachePolicyOptions, CachePolicy, CacheProvisionOptions} from "catbox";
    
    export interface Request
    {
        generateResponse(): IReply;
        generateResponse(source: IReply, options?: any): IReply;
    }
    
    export interface IReply 
    {
        <T>(err: Boom.BoomError, result?: string | number | boolean | Buffer | stream.Stream | IPromise<T> | T, credentialData?: any): Response;
    }    

    interface ServerCache
    {
        (options: ICatBoxCacheOptions): CachePolicy;
        (options: CachePolicyOptions): CachePolicy;
        provision(options: CacheProvisionOptions): Promise<void>
        provision(options: CacheProvisionOptions, callback: (err) => void)
    }
}