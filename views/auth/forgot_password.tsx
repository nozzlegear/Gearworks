/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {Crumb} from "../crumb";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";
import {Routes} from "../../routes/auth/auth-routes";

export interface IProps extends LayoutProps
{
    error?: string;
    username?: string;
}

export default function ForgotPasswordPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="forgot-password">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form form-horizontal well" method="post" action={Routes.PostForgotPassword}>
                            <Crumb value={props.crumb} />
                            <div className="form-group">
                                <label className="col-md-2 control-label">{"Email"}</label>
                                <div className="col-md-10">
                                    <input className="form-control" type="text" name="username" value={props.username}/>
                                </div> 
                            </div>
                            {props.error ? <p className="error">{props.error}</p> : null}
                            <div className="form-footer">
                                <button type="submit" className="btn btn-primary">
                                    {"Reset Password"}
                                </button>
                                <a href={Routes.GetLogin}>
                                    {"Know your password?"}
                                </a>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}