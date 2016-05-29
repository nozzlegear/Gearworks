/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";

export interface IProps extends LayoutProps
{
    shopUrl?: string;
    error?: string;
}

export default function SetupPage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="setup">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form form-horizontal well" method="post" action="/setup">
                            <div className="form-group">
                                <div className="col-md-12">
                                    <input className="form-control" type="text" name="shopUrl" value={props.shopUrl} placeholder="Your *.myshopify.com URL" />
                                </div>
                            </div>
                            {props.error ? <p className="error">{props.error}</p> : null}
                            <div className="form-footer">
                                <button type="submit" className="btn btn-primary">
                                    {"Connect my Shopify store"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}