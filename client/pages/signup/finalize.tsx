import { parse } from "qs";
import * as React from 'react';
import { observer } from "mobx-react";
import store from "../../stores/auth";
import Box from "../../components/box";
import { Paths } from "../../../modules/paths";
import { blueGrey700 } from "material-ui/styles/colors";
import { Shopify, ApiError } from "../../../modules/api";
import Observer from "../../components/observer_component";
import { CircularProgress, RaisedButton, FontIcon } from "material-ui";

export interface IProps {

}

export interface IState {
    error?: string;
}

@observer(["auth", "dashboard"])
export default class FinalizePage extends Observer<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {}

        if (!useSetState) {
            this.state = state;

            return;
        }

        this.setState(state);
    }

    //#endregion

    public async componentDidMount() {
        const qs = parse(window.location.search.replace(/^\?/i, "")) as { code: string, shop: string, hmac: string, state?: string };
        const api = new Shopify(this.props.auth.token);

        try {
            const result = await api.authorize(qs);

            this.props.auth.login(result.token);
            this.context.router.push(Paths.home.index);
        } catch (e) {
            const err: ApiError = e;

            this.setState({ error: err.message });
        }
    }

    private tryAgain(e: React.FormEvent<any> | React.MouseEvent<any>) {
        e.preventDefault();

        this.context.router.push(Paths.signup.integrate);
    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {error} = this.state;
        const padding = "50px";
        let action: JSX.Element;

        if (error) {
            action = <RaisedButton primary={true} fullWidth={true} label="Try again" onTouchTap={(e) => this.tryAgain(e)} />;
        }

        return (
            <section id="signup">
                <div className="pure-g center-children">
                    <div className="pure-u-12-24">
                        <Box title={`Connecting your Shopify store.`} description="Please wait." footer={action} error={error}>
                            <div style={{ paddingTop: padding, paddingBottom: padding, textAlign: "center" }}>
                                {!error ? <CircularProgress /> : <FontIcon className="fa fa-frown-o" color={blueGrey700} style={{ fontSize: "6em" }} />}
                            </div>
                        </Box>
                    </div>
                </div>
            </section>
        );
    }
}