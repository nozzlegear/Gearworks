/// <reference path="./../typings/typings.d.ts" />

import * as React from "react";
import {map} from "lodash";
import {DefaultContext} from "gearworks";

export default function Nav(props: DefaultContext)
{
    const links = map([], (link: { href: string; text: string; }) => <li><a href={link.href}>{link.text}</a></li>)
    
    return (
        <nav className="navbar navbar-inverse navbar-fixed-top">
            <div className="container">
                <div className="navbar-header">
                    <a href="/" className="navbar-brand">
                        {props.appName}
                    </a>
                    <button className="navbar-toggle" type="button" data-toggle="collapse" data-target="#navbar-main">
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                        <span className="icon-bar"></span>
                    </button>
                </div>
                <div className="navbar-collapse collapse" id="navbar-main">
                    <ul className="nav navbar-nav">
                        {links}
                    </ul>

                    <ul className="nav navbar-nav navbar-right">
                        {
                            !props.user.isAuthenticated ?
                            [
                                <li key="register-link"><a href="/auth/register">{"Create account"}</a></li>,
                                <li key="sign-in-link"><a href="/auth/login">{"Sign in"}</a></li>,
                            ] :
                            <li className="dropdown">
                                <a aria-expanded="false" className="dropdown-toggle" data-toggle="dropdown" href="#" id="themes">
                                    {`${props.user.username} `}
                                    <span className="caret"></span>
                                </a>
                                <ul className="dropdown-menu" aria-labelledby="themes">
                                    <li><a href="/account">{"Account Settings"}</a></li>
                                    <li className="divider"></li>
                                    <li><a href="/auth/logout">{"Sign out"}</a></li>
                                </ul>
                            </li>
                        }
                    </ul>
                </div>
            </div>
        </nav>
    )
}