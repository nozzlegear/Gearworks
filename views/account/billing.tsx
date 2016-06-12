/// <reference path="./../../typings/typings.d.ts" />

import * as React from "react";
import {map} from "lodash";
import {Plans} from "../../modules/plans";
import Layout, {LayoutProps} from "../layout";
import {DefaultContext, Plan} from "gearworks";
import {Routes} from "../../routes/account/account-routes";
import {SparkpostKey, EmailDomain} from "../../modules/config";

export interface IProps extends LayoutProps
{
    error?: string;
    trialEndsOn?: string;
    billingOn: string;
    plan: Plan;
}

export default function BillingPage(props: IProps & DefaultContext)
{
    const plans = map(Plans, plan => 
        <option key={plan.id} value={plan.id}>{`${plan.name} — $${plan.price.toFixed(2)}/month`}</option>
    );

    return (
        <Layout {...props}>
            <section id="billing">
                <h1 className="page-title">{props.title}</h1>
                <div className="row">
                    <div className="col-md-6">
                        <form className="form well" method="post" action={Routes.PostBilling}>
                            {!props.trialEndsOn ? null : 
                                <div className="underline">
                                    <strong>{"Trial Ends On"}</strong>
                                    <span className="pull-right">{new Date(props.trialEndsOn).toDateString()}</span>
                                </div>
                            }
                            <div className="underline">
                                <strong>{"Billing To"}</strong>
                                <span className="pull-right">{"Your Shopify Account"}</span>
                            </div>
                            <div className="underline">
                                <strong>{"Next Charge"}</strong>
                                <span className="pull-right">{new Date(props.billingOn).toDateString()}</span>
                            </div>
                            <div className="form-group">
                                <select className="form-control" name="plan" defaultValue={props.plan.id} autoComplete={"off"}>
                                    {plans}
                                </select>
                            </div>
                            {props.error ? <p className="error">{props.error}</p> : null}
                            <div className="form-footer">
                                <button type="submit" className="btn btn-primary">
                                    {"Update Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="col-md-5 col-md-offset-1">
                        <div className="alert alert-success">
                            <h4>{"Need to change your plan?"}</h4>
                            <p>
                                {"You can do so at any time by selecting the desired plan from the dropdown list. When you make a change to your current plan, it will take effect immediately. However, your card will not be charged for the new plan's value until the end of your current billing cycle."}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}