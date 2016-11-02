/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {Crumb} from "../crumb";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";
import {Routes} from "../../routes/auth/auth-routes";

export interface IProps extends LayoutProps
{
    error?: string;
    token: string;
}

export default function ResetPasswordPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="reset-password">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form well" method="post" autoComplete={"off"} action={`${Routes.PostResetPassword}?token=${props.token}`}>
                            <Crumb value={props.crumb} />
                            <div className="form-group">
                                <input className="form-control" placeholder={"New Password"} type="password" name="password"/>
                            </div>
                            <div className="form-group">
                                <input className="form-control" placeholder={"Retype New Password"} type="password" name="confirmPassword"/>
                            </div>
                            <input type="hidden" name={"token"} value={props.token} />
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