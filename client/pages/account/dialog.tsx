import * as React from 'react';
import { Dialog, FlatButton, RaisedButton, TextField } from "material-ui";

export interface IProps extends React.Props<any> {
    open: boolean;
    type: "email" | "password";
    onRequestClose: () => void;
}

export interface IState {
    saving?: boolean;
}

export default class AccountDialog extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);

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

    public componentDidMount() {

    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {open, type, onRequestClose} = this.props;
        const actions = [
            <FlatButton key="close-dialog-button" label="Close" onTouchTap={e => onRequestClose()} style={{ float: "left" }} />,
            <RaisedButton key="save-dialog-button" label="Save changes" primary={true} />
        ];
        let body: JSX.Element;

        if (type === "email") {
            body = <TextField floatingLabelText="New Email Address" fullWidth={true} />;
        } else {
            body = <TextField floatingLabelText="New Password" fullWidth={true} type="password" />;
        }

        return (
            <Dialog
                open={open}
                title={type === "email" ? "Update email address." : "Update password."}
                modal={false}
                actions={actions}
                onRequestClose={buttonClicked => onRequestClose()}>
                {body}
                <TextField floatingLabelText="Current Password" fullWidth={true} type="password" />
            </Dialog>
        );
    }
}