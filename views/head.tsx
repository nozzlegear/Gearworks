/// <reference path="./../typings/typings.d.ts" />

import * as React from "react";
import {map, uniqueId} from "lodash";
import {DefaultContext} from "gearworks";

export interface IProps
{
    title: string;
    
    skipCommonCss?: boolean;
    
    disallowRobots?: boolean;
    
    /**
     * Extra CSS that will be appended to the layout's head.
     */
    css?: string[];
}

export default function Head(props: IProps & DefaultContext)
{
    const links = map(props.css, link => <link key={uniqueId()} href={link} rel="stylesheet" />);
    
    //A custom fontawesome script allows async icon loading and accessibility best practices. Must be in the head.
    const customFontAwesome = <script key={uniqueId()} src="https://use.fontawesome.com/47ceb506ad.js"></script>;
    
    return (
        <head>
            <title>{props.title} | {props.appName}</title>

            <meta charSet="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0' name='viewport' />
            <link rel="shortcut icon" href="/images/favicon.ico?v=3" type="image/x-icon" />
            
            {props.disallowRobots ? <meta name="robots" content="noindex, nofollow" /> : null}
            
            { 
                props.skipCommonCss ? null :
                
                [
                    <link key={uniqueId()} href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet" />,
                    <link key={uniqueId()} href="https://maxcdn.bootstrapcdn.com/bootswatch/3.3.6/paper/bootstrap.min.css" rel="stylesheet" />,
                    <link key={uniqueId()} href="/wwwroot/css/theme.min.css" rel="stylesheet" />,
                    customFontAwesome
                ]
            }
            
            {links}
        </head>
    );
}
