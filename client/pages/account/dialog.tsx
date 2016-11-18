import * as React from 'react';
import store from "../../stores/auth";
import Router from "../../components/router";
import { Users, ApiError, SessionTokenResponse } from "../../../modules/api";
import { Dialog, FlatButton, RaisedButton, TextField, FontIcon } from "material-ui";

export interface IProps extends React.Props<any> {
    open: boolean;
    type: "email" | "password";
    onRequestClose: () => void;
}

export interface IState {
    saving?: boolean;
    error?: string;
}

export default class AccountDialog extends Router<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private oldPasswordControl: TextField;

    private newPasswordControl: TextField;

    private newEmailControl: TextField;

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

    private async saveChanges() {
        if (this.state.saving) {
            return;
        }

        const oldPassword = this.oldPasswordControl.getValue();
        const api = new Users(store.token);

        if (!oldPassword) {
            this.setState({ error: "You must enter your current password first." });

            return;
        }

        let request: Promise<SessionTokenResponse>;
        let token: string;

        if (this.props.type === "password") {
            const newPassword = this.newPasswordControl.getValue();

            if (!newPassword || newPassword.length < 6) {
                this.setState({ error: "Your new password must be at least 6 characters long." });

                return;
            }

            request = api.changePassword({ new_password: newPassword, old_password: oldPassword });
        } else {
            const email = this.newEmailControl.getValue();

            request = api.changeUsername({ password: oldPassword, username: email });
        }

        this.setState({ saving: true, error: undefined });

        try {
            const result = await request;

            token = result.token;
        } catch (e) {
            const err: ApiError = e;

            if (err.unauthorized && this.handleUnauthorized(this.PATHS.account.index)) {
                return;
            }

            this.setState({ error: err.message, saving: false });

            return;
        }

        this.setState({ saving: false }, () => {
            store.login(token);
            this.props.onRequestClose();
        });
    }

    public componentDidMount() {

    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {open, type, onRequestClose} = this.props;
        const { error, saving } = this.state;
        const actions = [
            <FlatButton key="close-dialog-button" label="Close" onTouchTap={e => onRequestClose()} style={{ float: "left" }} />,
            <RaisedButton
                key="save-dialog-button"
                label={saving ? "Saving changes" : "Save changes"}
                icon={saving ? <FontIcon className="fa fa-spinner fa-spin" /> : null}
                primary={true}
                onTouchTap={e => this.saveChanges()} />
        ];
        let body: JSX.Element;

        if (type === "email") {
            body = <TextField floatingLabelText="New Email Address" fullWidth={true} ref={c => this.newEmailControl = c} />;
        } else {
            body = <TextField floatingLabelText="New Password" fullWidth={true} type="password" ref={c => this.newPasswordControl = c} />;
        }

        return (
            <Dialog
                open={!!open}
                title={type === "email" ? "Update email address." : "Update password."}
                modal={false}
                actions={actions}
                onRequestClose={buttonClicked => onRequestClose()}>
                {body}
                <TextField floatingLabelText="Current Password" fullWidth={true} type="password" ref={c => this.oldPasswordControl = c} />
                {error ? <p className="error">{error}</p> : null}
            </Dialog>
        );
    }
}