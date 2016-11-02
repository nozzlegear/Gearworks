/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {Crumb} from "../crumb";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";
import {Routes} from "../../routes/account/account-routes";

export interface IProps extends LayoutProps
{
    error?: string;
    success?: boolean;
}

export default function SettingsPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="account-settings">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form form-horizontal well" method="post" action={Routes.PostSettings}>
                            <Crumb value={props.crumb} />
                            <div className="form-group">
                                <label className="col-md-4 control-label">{"Old Password"}</label>
                                <div className="col-md-8">
                                    <input className="form-control" type="password" name="oldPassword" autoComplete="off" />
                                </div> 
                            </div>
                            <div className="form-group">
                                <label className="col-md-4 control-label">{"New Password"}</label>
                                <div className="col-md-8">
                                    <input className="form-control" type="password" name="newPassword" autoComplete="off" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="col-md-4 control-label">{"Confirm Password"}</label>
                                <div className="col-md-8">
                                    <input className="form-control" type="password" name="confirmPassword" autoComplete="off" />
                                </div>
                            </div>
                            {props.success ? <p className="success">{"Your password has been updated."}</p> : null}
                            {props.error ? <p className="error">{props.error}</p> : null}
                            <div className="form-footer">
                                <button type="submit" className="btn btn-primary">
                                    {"Update Password"}
                                </button>
                                <span />
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}