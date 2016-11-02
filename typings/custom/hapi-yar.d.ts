/// <reference path="./../typings.d.ts" />

declare module "hapi"
{
    interface YarStatic
    {
        /**
         * Clears the session and assigns a new session id.
         */
        reset(): void;
        
        /**
         * Assigns a value to a given key which will persist across requests. Returns the value.
         */
        set<T>(key: string, value: T): T;
        
        /**
         * Assigns values to multiple keys using each 'keysObject' top-level property. 
         * Returns the keysObject.
         */
        set<T>(keysObject: T): T;
        
        /**
         * Retrieve value using a key. If 'clear' is 'true', key is cleared on return.
         */
        get(key: string, clear: boolean): any;
        
        /**
         * Retrieve value using a key. If 'clear' is 'true', key is cleared on return.
         */
        get<T>(key: string, clear: boolean): T;
        
        /**
         * Clears the key.
         */
        clear(key: string): void;
        
        /**
         * Manually notify the session of changes (when using get() and changing the 
         * content of the returned reference directly without calling set()).
         */
        touch(): void;
        
        /**
         * Stores volatile data - data that should be deleted once read. When given no 
         * arguments, it will return all of the flash messages and delete the originals.
         * When given only a type, it will return all of the flash messages of that type 
         * and delete the originals. When given a type and a message, it will set or append 
         * that message to the given type. 'isOverride' used to indicate that the message 
         * provided should replace any existing value instead of being appended to it 
         * (defaults to false).
         */
        flash(type, message, isOverride): any;
        
        /**
         * If set to 'true', enables lazy mode. In lazy mode, request.yar can be modified directly 
         * (e.g. setting request.yar.myKey to an object value), and those keys will be stored and 
         * loaded back. Lazy mode isn't as fast as the normal get/set because it has to store the 
         * session state on every responses regardless of any changes being made.
         */
        lazy(enabled: boolean): void;
    }
    
    export interface Request
    {
        yar: YarStatic
    }
}