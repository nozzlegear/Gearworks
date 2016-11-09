import * as React from 'react';
import {
    Dialog,
    RaisedButton,
    TextField,
    Divider,
    FlatButton,
    SelectField,
    MenuItem,
    TouchTapEvent,
    CircularProgress,
} from "material-ui";
import { Shopify } from "../../modules/api";
import Dashboard from "../stores/dashboard";
import { AutoPropComponent } from "auto-prop-component";

export interface IProps extends React.Props<any> {
    open: boolean;
    apiToken: string;
    onRequestClose: () => void;
}

export interface IState {
    error?: string;
    loading?: boolean;
    name?: string;
    email?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    lineItem?: string;
    quantity?: number;
}

export default class NewOrderDialog extends AutoPropComponent<IProps, IState> {
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

    private async saveOrder(e: TouchTapEvent) {
        e.preventDefault();

        if (this.state.loading) {
            return;
        }

        this.setState({ loading: true });

        const newOrder = Object.assign({}, this.state);
        const api = new Shopify(this.props.apiToken);
        let order: any;
        let error: string = undefined;

        try {
            const result = await api.createOrder(newOrder);

            if (!result.ok) {
                error = result.error.message;
            } else {
                order = result.data;
            }
        } catch (e) {
            console.error(e);

            error = "Something went wrong and your order could not be saved.";
        }

        this.setState({ error: error, loading: false }, () => {
            if (order) {
                console.log("TODO: clear form.");

                Dashboard.addOrder(order);
                this.props.onRequestClose();
            }
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
        const props = this.props;
        const state = this.state;
        let actions: JSX.Element[] = [];
        let form: JSX.Element;

        if (this.state.loading) {
            form = (
                <div className="text-center" style={{ paddingTop: "50px", paddingBottom: "50px" }}>
                    <CircularProgress />
                </div>
            )
        } else {
            actions = [
                <FlatButton
                    key="close_dialog"
                    label="Close"
                    style={{ float: "left" }}
                    onTouchTap={e => props.onRequestClose()} />,
                <RaisedButton
                    key="save_order"
                    label="Save Order"
                    primary={true}
                    onTouchTap={e => this.saveOrder(e)} />,
            ];

            form = (
                <form className="pure-g">
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="Customer Name"
                            hintText={"Jane Doe"}
                            defaultValue={state.name}
                            onChange={this.updateStateFromEvent((s, v) => s.name = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="Customer Email"
                            hintText={"jane.doe@example.com"}
                            defaultValue={state.email}
                            onChange={this.updateStateFromEvent((s, v) => s.email = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="Street Address"
                            hintText={"123 4th Street"}
                            defaultValue={state.street}
                            onChange={this.updateStateFromEvent((s, v) => s.street = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="City"
                            hintText="Smalltown"
                            defaultValue={state.city}
                            onChange={this.updateStateFromEvent((s, v) => s.city = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="State/Province"
                            hintText="Minnesota"
                            defaultValue={state.state}
                            onChange={this.updateStateFromEvent((s, v) => s.state = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="ZIP/Postal Code"
                            hintText="12345"
                            defaultValue={state.zip}
                            onChange={this.updateStateFromEvent((s, v) => s.zip = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="Line Item"
                            hintText="Barrel of Fun"
                            defaultValue={state.lineItem}
                            onChange={this.updateStateFromEvent((s, v) => s.lineItem = v)} />
                    </div>
                    <div className="form-group pure-u-12-24">
                        <TextField
                            floatingLabelText="Quantity"
                            hintText="12"
                            value={state.quantity}
                            onChange={this.updateStateFromEvent((s, v) => s.quantity = v)} />
                    </div>
                </form>
            )
        }

        return (
            <Dialog
                open={props.open || false}
                actions={actions}
                modal={true}
                title="New Order"
                onRequestClose={e => props.onRequestClose()}>
                {form}
                {this.state.error ? <p className="error dialog">{this.state.error}</p> : null}
            </Dialog>
        );
    }
}