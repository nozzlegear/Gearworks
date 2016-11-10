import * as React from 'react';
import * as Bluebird from "bluebird";
import store from "../../stores/auth";
import Box from "../../components/box";
import { SessionToken } from "gearworks";
import Paths from "../../../modules/paths";
import { Sessions } from "../../../modules/api";
import { APP_NAME } from "../../../modules/constants";
import Observer from "../../components/observer_component";
import { TextField, RaisedButton, FontIcon } from "material-ui";
import { RouterState, RedirectFunction, Link } from "react-router";

export interface IProps extends React.Props<any> {

}

export interface IState {
    error?: string;

    loading?: boolean;

    username?: string;

    password?: string;
}

export default class AuthPage extends Observer<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private pageContainer: Element;

    private api = new Sessions();

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {
            username: "",
            password: "",
        };

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

        const {username, password} = this.state;

        if (!username) {
            this.mergeState({ error: "You must enter your username." });

            return;
        }

        if (!password) {
            this.mergeState({ error: "You must enter your password." });

            return;
        }

        this.mergeState({ loading: true, error: undefined });

        try {
            const result = await this.api.create({ username, password });

            store.login(result.data.token);
        } catch (e) {
            this.setState({ loading: false, error: "Something went wrong and we could not sign you in. Please try again." });
            console.log(e);

            return;
        }

        this.mergeState({ loading: false }, () => this.context.router.push(Paths.home.index));
    }

    //#endregion

    public static willTransitionTo(router: RouterState, replace: RedirectFunction) {

    }

    public componentDidMount() {

    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {error, loading, username, password} = this.state;
        const footer = <RaisedButton onTouchTap={e => this.handleSignIn(e)} primary={true} fullWidth={true} label={loading ? "Signing in" : "Sign in"} icon={loading ? <FontIcon className="fa fa-spinner fa-spin" /> : null} />;

        return (
            <section id="login">
                <div className="pure-g center-children">
                    <div className="pure-u-12-24">
                        <Box title="Sign in to your account." error={error} footer={footer}>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Email"
                                    type="email"
                                    value={username}
                                    onChange={this.updateStateFromEvent((s, v) => s.username = v)} />
                            </div>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Password"
                                    type="password"
                                    value={password}
                                    onChange={this.updateStateFromEvent((s, v) => s.password = v)} />
                            </div>
                        </Box>
                        <div className="info-line">
                            <Link to={Paths.signup.index}>{"Don't have an account? Click here to create one."}</Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}