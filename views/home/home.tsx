/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {DefaultContext} from "gearworks";
import Layout, {LayoutProps} from "../layout";

export interface IProps extends LayoutProps
{
    shopName: string;
}

export default function HomePage(props: IProps & DefaultContext)
{
    return (
        <Layout {...props}>
            <section id="home">
                <h1 className="page-title">
                    {"Your Dashboard"}
                </h1>
                <p>
                    {`Welcome to ${props.appName}! Your Shopify store (${props.shopName}) has been connected and your free trial has been started.`}
                </p>
            </section>
        </Layout>
    );
}