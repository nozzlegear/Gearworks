import * as React from 'react';
import Box from "../../components/box";
import Theme from "../../modules/theme";
import Router from "../../components/router";
import { APP_NAME } from "../../modules/constants";
import { Users, ApiError } from "../../modules/api";
import { TextField, RaisedButton, FontIcon } from "material-ui";
import EmailIcon from "material-ui/svg-icons/communication/email";
import { RouterState, RedirectFunction, Link } from "react-router";

export interface IProps extends React.Props<any> {

}

export interface IState {
    error?: string;
    loading?: boolean;
    sent?: boolean;
}

export default class ForgotPasswordPage extends Router<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private api = new Users();

    private emailBox: TextField;

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

        if (!username) {
            this.setState({ error: "You must enter your username." });

            return;
        }

        this.setState({ loading: true, error: undefined });

        try {
            const result = await this.api.forgotPassword({ username });

            this.setState({ loading: false, sent: true });
        } catch (e) {
            const err: ApiError = e;

            this.setState({ loading: false, error: err.message });
        }
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
        const {sent, error, loading} = this.state;
        let body: JSX.Element;

        if (sent) {
            body = (
                <Box
                    title="Password reset email sent."
                    description="Your password reset request has been sent. Please allow up to 10 minutes for it to arrive, and be sure you check your spam or junk mail folder."
                    error={error}>
                    <div style={{ paddingTop: "40px", paddingBottom: "40px", textAlign: "center" }}>
                        <EmailIcon style={{ height: "125px", width: "125px", color: Theme.rawTheme.palette.primary1Color }} />
                    </div>
                </Box>
            );
        } else {
            const footer = (
                <div style={{ textAlign: "center" }}>
                    <RaisedButton
                        onTouchTap={e => this.handleSignIn(e)}
                        primary={true}
                        fullWidth={true}
                        label={loading ? "Sending reset email" : "Send password reset email"}
                        icon={loading ? <FontIcon className="fa fa-spinner fa-spin" /> : null} />
                </div>
            );

            body = (
                <Box title="Forgot your password?" error={error} footer={footer}>
                    <div className="form-group">
                        <TextField
                            fullWidth={true}
                            floatingLabelText="Email"
                            type="email"
                            ref={box => this.emailBox = box} />
                    </div>
                </Box>
            )
        }

        return (
            <section id="login">
                <div className="pure-g center-children">
                    <div className="pure-u-1-1 pure-u-md-12-24">
                        {body}
                        <div className="info-line">
                            <Link to={this.PATHS.auth.login}>{"Already know your password? Click here to log in."}</Link>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}