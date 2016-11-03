/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";
import {Routes} from "../../routes/auth/auth-routes";

export interface IProps extends LayoutProps
{
    
}

export default function ResetSentPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="reset-sent">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form form-horizontal well">
                            <p>{"Your password reset request has been sent. Please allow up to 10 minutes for it to arrive, and be sure you check your spam or junk mail folder."}</p>
                            <div className="form-footer">
                                <span />
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