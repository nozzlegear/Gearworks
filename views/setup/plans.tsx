/// <reference path="./../../typings/typings.d.ts" />

import {map} from "lodash";
import {Crumb} from "../crumb";
import * as React from "react";
import Layout, {LayoutProps} from "../layout";
import {DefaultContext, Plan} from "gearworks";

export interface IProps extends LayoutProps
{
    plans: Plan[];
}

export default function PlansPage(props: IProps & DefaultContext)
{
    const plans = map(props.plans, (plan, index) => 
        <div key={plan.id} className={`col-md-4`}>
            <form className="plan" method="POST">
                <Crumb value={props.crumb} />
                <div className={`plan-header plan-index-${index}`}>
                    <h3 className="plan-title">{`${plan.name}`}</h3>
                    <h5 className="plan-pricing">{`$${plan.price.toFixed(2)} /month`}</h5>
                </div>
                <div className="plan-features">
                    <ul>
                        <li>{plan.description}</li>
                    </ul>
                    <input type="hidden" value={plan.id} name="planId" />
                    <div className="plan-command">
                        <button className="btn btn-primary" type="submit">Select Plan</button>
                    </div>
                </div>
            </form>
        </div>
    );
    
    return (
        <Layout {...props} css={["/wwwroot/css/pricing.min.css"]}>
            <section id="plans">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    {plans}
                </div>
            </section>
        </Layout>
    );
}