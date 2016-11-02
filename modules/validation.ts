/// <reference path="./../typings/typings.d.ts" />

import {ValidationError} from "joi";
import capitalize = require("string-capitalize");

export function humanizeError(error: ValidationError)
{
    let message = capitalize(error.details.map(d => d.message.replace(/["]/ig, '')).join(', ')); 
    
    if (message.substring(message.length - 1))
    {
        message += '.';
    }
    
    return message;
}