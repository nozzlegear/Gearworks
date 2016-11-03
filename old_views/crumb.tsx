/// <reference path="./../typings/typings.d.ts" />

import * as React from "react";

export function Crumb(props: {value: string})
{
    return <input type="hidden" name="crumb" value={props.value} />
}