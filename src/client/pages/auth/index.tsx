import * as Bluebird from 'bluebird';
import * as qs from 'qs';
import * as React from 'react';
import Box from '../../components/box';
import Router from '../../components/router';
import { ApiError } from 'gearworks-http/bin';
import { APP_NAME } from '../../../shared/constants';
import { AuthStore } from '../../stores';
import { FontIcon, RaisedButton, TextField } from 'material-ui';
import { Link, RedirectFunction, RouterState } from 'react-router';
import { SessionsApi } from '../../api';

export interface IProps extends React.Props<any> {

}

export interface IState {
    error?: string;
    loading?: boolean;
}

export default class AuthPage extends Router<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private redirectPath: string;

    private redirectQuerystring: Object;

    private api = new SessionsApi();

    private emailBox: TextField;

    private passwordBox: TextField;

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

        const username = this.emailBox.getValue();
        const password = this.passwordBox.getValue();
        let token: string;

        if (!username) {
            this.setState({ error: "You must enter your username." });

            return;
        }

        if (!password) {
            this.setState({ error: "You must enter your password." });

            return;
        }

        this.setState({ loading: true, error: undefined });

        try {
            const result = await this.api.create({ username, password });

            token = result.token;
        } catch (e) {
            const err: ApiError = e;

            this.setState({ error: err.message, loading: false });

            return;
        }

        AuthStore.login(token);

        if (this.redirectPath) {
            this.context.router.push(`${this.redirectPath}?${qs.stringify(this.redirectQuerystring)}`);
        } else {
            this.context.router.push(this.PATHS.home.index);
        }
    }

    //#endregion

    public static willTransitionTo(router: RouterState, replace: RedirectFunction) {

    }

    public componentDidMount() {
        const query = qs.parse(window.location.search.replace(/^\?/i, "")) as { redirect?: string, qs?: Object };

        if (query.redirect) {
            this.redirectPath = query.redirect;
            this.redirectQuerystring = query.qs;
        }
    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const { error, loading } = this.state;
        const footer = (
            <div style={{ textAlign: "center" }}>
                <RaisedButton
                    onTouchTap={e => this.handleSignIn(e)}
                    primary={true}
                    fullWidth={true}
                    label={loading ? "Signing in" : "Sign in"}
                    icon={loading ? <FontIcon className="fa fa-spinner fa-spin" /> : null}
                    style={{ marginBottom: "25px" }} />
                <Link to={this.PATHS.auth.forgotPassword}>{"Forgot your password?"}</Link>
            </div>
        );

        return (
            <section id="login">
                <div className="pure-g center-children">
                    <div className="pure-u-1-1 pure-u-md-12-24">
                        <Box title="Sign in to your account." error={error} footer={footer}>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Email"
                                    type="email"
                                    ref={box => this.emailBox = box} />
                            </div>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Password"
                                    type="password"
                                    ref={box => this.passwordBox = box} />
                            </div>
                        </Box>
                        <div className="info-line">
                            <Link to={this.PATHS.signup.index}>{"Don't have an account? Click here to create one."}</Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}