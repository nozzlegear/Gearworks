import * as qs from "qs";
import * as React from 'react';
import { theme } from "../../app";
import Box from "../../components/box";
import Paths from "../../../modules/paths";
import { APP_NAME } from "../../../modules/constants";
import { Users, ApiError } from "../../../modules/api";
import Observer from "./../../components/observer_component";
import { TextField, RaisedButton, FontIcon } from "material-ui";
import EmailIcon from "material-ui/svg-icons/communication/email";
import { RouterState, RedirectFunction, Link } from "react-router";

export interface IProps extends React.Props<any> {

}

export interface IState {
    error?: string;
    loading?: boolean;
}

export default class ResetPasswordPage extends Observer<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private api = new Users();

    private token: string;

    private passwordControl: TextField;

    private confirmControl: TextField;

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {};

        if (!useSetState) {
            this.state = state;

            return;
        }

        this.setState(state);
    }

    //#endregion

    //#region Event listeners

    private async handleSignIn(e: React.MouseEvent<any> | React.FormEvent<any>) {
        e.preventDefault();

        if (this.state.loading) {
            return;
        }

        const password = this.passwordControl.getValue();
        const confirmPassword = this.confirmControl.getValue();

        if (!password || password.length < 6) {
            this.setState({ error: "Password must be at least 6 characters long." });

            return;
        }

        if (confirmPassword !== password) {
            this.setState({ error: "Passwords do not match." });

            return;
        }

        this.setState({ loading: true, error: undefined });

        try {
            const result = await this.api.resetPassword({ reset_token: this.token, new_password: password });

            this.context.router.push(Paths.auth.login);
        } catch (e) {
            const err: ApiError = e;
            let message = err.unauthorized ? "Your password reset email has expired." : err.message;
            
            this.setState({ loading: false, error: message });
        }
    }

    //#endregion

    public static willTransitionTo(router: RouterState, replace: RedirectFunction) {

    }

    public componentDidMount() {
        const query = qs.parse(window.location.search.replace(/^\?/, "")) as { token: string };

        if (!query.token) {
            this.context.router.replace(Paths.auth.forgotPassword);

            return;
        }

        this.token = decodeURIComponent(query.token);
    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {error, loading} = this.state;
        const footer = (
            <div style={{ textAlign: "center" }}>
                <RaisedButton
                    onTouchTap={e => this.handleSignIn(e)}
                    primary={true}
                    fullWidth={true}
                    label={loading ? "Resetting password" : "Reset password"}
                    icon={loading ? <FontIcon className="fa fa-spinner fa-spin" /> : null} />
            </div>
        );

        return (
            <section id="login">
                <div className="pure-g center-children">
                    <div className="pure-u-12-24">
                        <Box title="Reset your password." error={error} footer={footer}>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="New Password"
                                    type="password"
                                    ref={c => this.passwordControl = c} />
                            </div>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Confirm New Password"
                                    type="password"
                                    ref={c => this.confirmControl = c} />
                            </div>
                        </Box>
                        <div className="info-line">
                            <Link to={Paths.auth.login}>{"Already know your password? Click here to log in."}</Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}