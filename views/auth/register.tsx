/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";

export interface IProps extends LayoutProps
{
    username?: string;
    error?: string;
}

export default function RegisterPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="register">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form form-horizontal well" method="post" action="/auth/register" autoComplete="off">
                            <div className="form-group">
                                <label className="col-md-2 control-label">{"Username"}</label>
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
                                    {"Register"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}