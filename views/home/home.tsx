/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import Layout, {LayoutProps} from "../layout";

export interface IProps extends LayoutProps
{
    
}

export default function HomePage(props: IProps)
{
    return (
        <Layout {...props}>
            <section id="home">
                <h1 className="page-title">
                    {"Your Dashboard"}
                </h1>
            </section>
        </Layout>
    );
}