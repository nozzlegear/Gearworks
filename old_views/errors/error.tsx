/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {DefaultContext} from "gearworks";
import LayoutHead, {IProps as HeadProps} from "../head";

export interface IProps extends HeadProps
{
    errorType: string;
    message: string;
    statusCode: number;
}

export default function ErrorPage(props: IProps & DefaultContext)
{
    const styles = ["/wwwroot/css/error.min.css"];
    
    return (
        <html>
            <LayoutHead {...props} css={styles} />
            <body className="minimal">
                <main id="error">
                    <h1 className="logo">
                        <a href="/">
                            {props.appName} 
                        </a>
                    </h1>
                    <div className="error">
                        <h2>
                            Oops!
                        </h2>
                        <h3>{props.errorType}.</h3>
                        <a className="back" href="/" style={{"color":"#fff", "textDecoration":"underline"}}>Click here to go back.</a>
                    </div>
                </main>
            </body>
        </html>
    );
}