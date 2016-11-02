/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";
import {Routes} from "../../routes/auth/auth-routes";
import {Crumb} from "../crumb";
import {SparkpostKey, EmailDomain} from "../../modules/config";

export interface IProps extends LayoutProps
{
    username?: string;
    error?: string;
}

export default function LoginPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="login">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form form-horizontal well" method="post" action={Routes.PostLogin}>
                            <Crumb value={props.crumb}/>
                            <div className="form-group">
                                <label className="col-md-2 control-label">{"Email"}</label>
                                <div className="col-md-10">
                                    <input className="form-control" type="text" name="username" value={props.username} />
                                </div> 
                            </div>
                            <div className="form-group">
                                <label className="col-md-2 control-label">{"Password"}</label>
                                <div className="col-md-10">
                                    <input className="form-control" type="password" name="password" />
                                </div>
                            </div>
                            {props.error ? <p className="error">{props.error}</p> : null}
                            <div className="form-footer">
                                <button type="submit" className="btn btn-primary">
                                    {"Login"}
                                </button>
                                {
                                    ! (SparkpostKey && EmailDomain) ? null :
                                    <a href={Routes.GetForgotPassword}>
                                        {"Forgot password?"}
                                    </a>
                                }
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}