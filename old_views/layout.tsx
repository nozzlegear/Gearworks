/// <reference path="./../typings/typings.d.ts" />


import Nav from "./nav";
import * as React from "react";
import {DefaultContext} from "gearworks";
import {map, uniqueId, clone} from "lodash";
import LayoutHead, {IProps as HeadProps} from "./head"

export interface LayoutProps extends HeadProps, React.Props<any>
{   
    scripts?: string[];
}

export default function Layout(props: LayoutProps & DefaultContext)
{       
    const headProps = clone(props);
    const scripts = map(props.scripts, src => <script key={uniqueId()} src={src} />);
    
    return (
        <html lang="en">
        <LayoutHead {...headProps} />
        <body>
            <Nav {...props} />
            <main id="container" className="container">
                <div className="row">
                    <div className="col-md-12">
                        {props.children}
                    </div>
                </div>
            </main>
            <footer id="footer">
                <div>
                    <p>
                        {`© ${props.appName}, ${new Date().getUTCFullYear()}. All rights reserved.`}
                    </p>
                    <p>
                        {"Powered by "}
                        <a target="_blank" href="https://github.com/nozzlegear/gearworks">
                            {"Gearworks"}
                        </a>
                        {"."}
                    </p>
                </div>
            </footer>
            <div className="hide">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js" />
                <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js" />
                {scripts}
            </div>
        </body>
        </html>
    )
}