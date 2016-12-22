import Dialog from "./dialog";
import * as React from 'react';
import { Plan } from "gearworks";
import * as gravatar from "gravatar";
import { observer } from "mobx-react";
import { Models } from "shopify-prime";
import AuthStore from "../../stores/auth";
import Router from "../../components/router";
import { APP_NAME } from "../../modules/constants";
import { Shopify, ApiError } from "../../modules/api";
import {
    Card,
    CardHeader,
    CardText,
    CardActions,
    RaisedButton,
    TextField,
} from "material-ui";

export interface IProps {

}

export interface IState {
    emailDialogOpen?: boolean;
    passwordDialogOpen?: boolean;
}

@observer
export default class AccountPage extends Router<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private planBox: HTMLSelectElement;

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {
            
        }

        if (!useSetState) {
            this.state = state;

            return;
        }

        this.setState(state);
    }

    //#endregion

    public async componentDidMount() {
        
    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {emailDialogOpen, passwordDialogOpen} = this.state;
        const auth = AuthStore.session;

        return (
            <div>
                <section id="account" className="content">
                    <h2 className="content-title">{"Your Account"}</h2>
                    <div className="pure-g">
                        <div className="pure-u-1-1 pure-u-md-11-24">
                            <Card>
                                <CardHeader title={auth.shopify_shop_name} subtitle={auth._id} avatar={gravatar.url(auth._id)} />
                                <CardText>
                                    <div className="underline">
                                        <div className="pure-u-9-24">
                                            {"Date Created:"} 
                                        </div>
                                        <div className="pure-u-15-24 ellipsis text-right">
                                            {new Date(auth.date_created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </div>
                                    </div>
                                    <div className="underline">
                                        <div className="pure-u-8-24">
                                            {"Shop URL:"}
                                        </div>
                                        <div className="pure-u-16-24 ellipsis text-right">
                                            {auth.shopify_domain}
                                        </div>
                                    </div>
                                </CardText>
                                <CardActions>
                                    <RaisedButton label="Change Login Email" style={{marginBottom: "1rem"}} onTouchTap={e => this.setState({ emailDialogOpen: true })} />
                                    <RaisedButton label="Change Login Password" className="sm-float-right" onTouchTap={e => this.setState({ passwordDialogOpen: true })} />
                                </CardActions>
                            </Card>
                        </div>
                    </div>
                    <Dialog open={emailDialogOpen} type="email" onRequestClose={() => this.setState({ emailDialogOpen: false })} />
                    <Dialog open={passwordDialogOpen} type="password" onRequestClose={() => this.setState({ passwordDialogOpen: false })} />
                </section>
            </div>
        );
    }
}