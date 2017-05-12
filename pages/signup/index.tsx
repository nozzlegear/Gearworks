import * as React from 'react';
import Box from '../../components/box';
import Router from '../../components/router';
import store from '../../stores/auth';
import { ApiError, Users } from '../../modules/api';
import { APP_NAME } from '../../modules/constants';
import { FontIcon, RaisedButton, TextField } from 'material-ui';
import { Link } from 'react-router';

export interface IProps {

}

export interface IState {
    loading?: boolean;
    error?: string;
}

export default class SignupPage extends Router<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private usersApi = new Users();

    private emailBox: TextField;

    private passwordBox: TextField;

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = { }

        if (!useSetState) {
            this.state = state;

            return;
        }

        this.setState(state);
    }

    //#endregion

    private async createAccount(e: React.MouseEvent<any> | React.FormEvent<any>) {
        e.preventDefault();

        if (this.state.loading) {
            return;
        }

        this.setState({ loading: true, error: undefined });
        let token: string;

        try {
            const result = await this.usersApi.create({
                username: this.emailBox.getValue(),
                password: this.passwordBox.getValue(),
            });

            token = result.token;
        }
        catch (e) {
            const err: ApiError = e;

            this.setState({ loading: false, error: err.message });

            return;
        }

        store.login(token);
        this.context.router.push(this.PATHS.signup.integrate);
    }

    public componentDidMount() {

    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {loading, error} = this.state;
        const actions = (
            <RaisedButton
                fullWidth={true}
                primary={true}
                onTouchTap={e => this.createAccount(e)}
                label={loading ? "Starting Account" : "Start Account"}
                icon={loading ? <FontIcon className="fa fa-spinner fa-spin" /> : null} />);

        return (
            <section id="signup">
                <div className="pure-g center-children">
                    <div className="pure-u-1-1 pure-u-md-12-24">
                        <Box title={`Start your ${APP_NAME} account.`} footer={actions} error={error}>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Email"
                                    type="email"
                                    hintText="john.doe@example.com"
                                    ref={b => this.emailBox = b} />
                            </div>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Password"
                                    type="password"
                                    ref={b => this.passwordBox = b} />
                            </div>
                        </Box>
                        <div className="info-line">
                            <Link to={this.PATHS.auth.login}>{"Already have an account? Click here to log in."}</Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}