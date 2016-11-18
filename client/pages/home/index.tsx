import * as React from 'react';
import { theme } from "../../app";
import { observer } from "mobx-react";
import { Models } from "shopify-prime";
import NewOrderDialog from "./new_order_dialog";
import Observer from "../../components/observer";
import AddIcon from "material-ui/svg-icons/content/add";
import { Shopify, ApiError } from "../../../modules/api";
import DeleteIcon from "material-ui/svg-icons/action/delete";
import SelectAllIcon from "material-ui/svg-icons/content/select-all";
import {
    CircularProgress,
    Toolbar,
    ToolbarGroup,
    FloatingActionButton,
    DropDownMenu,
    MenuItem,
    IconButton,
    IconMenu,
    Snackbar,
} from "material-ui";
import {
    Table,
    TableBody,
    TableHeader,
    TableRow as TR,
    TableHeaderColumn as TH,
    TableRowColumn as TD
} from "material-ui/Table";

export interface IProps {

}

export interface IState {
    loading?: boolean;
    error?: string;
    dialogOpen?: boolean;
    selectedRows?: string | number[];
}

@observer(["dashboard", "auth"])
export default class HomePage extends Observer<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState;

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {}

        if (!useSetState) {
            this.state = state;

            return;
        }

        this.setState(state);
    }

    private getLineDescription(o: Models.Order) {
        const first = o.line_items[0];
        const suffix = o.line_items.length > 1 ? ` and ${o.line_items.length - 1} other items` : "";

        return `${first.quantity} x ${first.name}${suffix}.`;
    }

    private rowIsSelected(index: number) {
        const rows = this.state.selectedRows;

        if (Array.isArray(rows)) {
            return rows.some(r => r === index);
        } else if (rows === "all") {
            return true;
        }

        return false;
    }

    //#endregion

    private closeErrorSnackbar(reason: "timeout" | "clickaway" | string) {
        // Only hide the snackbar if its duration has expired. This prevents clicking anywhere on the app
        // and inadvertantly closing the snackbar.
        if (reason === "timeout") {
            this.setState({ error: undefined });
        }
    }

    private async toggleStatus(id: number, setStatusTo: "open" | "closed") {
        if (this.state.loading) {
            return;
        }

        this.setState({ loading: true, selectedRows: [] });

        const api = new Shopify(this.props.auth.token);
        let order: Models.Order;

        try {
            order = await (setStatusTo === "open" ? api.openOrder(id) : api.closeOrder(id));
        } catch (e) {
            const err: ApiError = e;

            if (err.unauthorized && this.handleUnauthorized(this.PATHS.home.index)) {
                return;
            }

            this.setState({ loading: false, error: err.message });

            return;
        }

        this.setState({loading: false, error: undefined}, () => {
            this.props.dashboard.updateOrder(id, order);
        })
    }

    private async deleteOrder(id: number) {
        if (this.state.loading) {
            return;
        }

        this.setState({ loading: true, selectedRows: [] });

        const api = new Shopify(this.props.auth.token);
        let error: string;

        try {
            await api.deleteOrder(id);
        } catch (e) {
            const err: ApiError = e;

            if (err.unauthorized && this.handleUnauthorized(this.PATHS.home.index)) {
                return;
            }

            error = err.message;
        }

        this.setState({ loading: false, error }, () => {
            if (!error) {
                this.props.dashboard.removeOrder(id);
            }
        });
    }

    public async componentDidMount() {
        const api = new Shopify(this.props.auth.token);
        let orders: Models.Order[] = [];
        let error: string;

        try {
            orders = await api.listOrders({ limit: 100, page: 1 });
        } catch (e) {
            const err: ApiError = e;
            
            if (err.unauthorized && this.handleUnauthorized(this.PATHS.home.index)) {
                return;
            }

            error = err.message;
        }

        this.setState({ error }, () => {
            if (!error) {
                this.props.dashboard.loadOrders(orders);
            }
        });
    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        let body: JSX.Element;
        let toolbar: JSX.Element;

        if (!this.props.dashboard.loaded) {
            body = (
                <div className="text-center" style={{ paddingTop: "50px", paddingBottom: "50px" }}>
                    <CircularProgress />
                </div>
            );
        } else {
            body = (
                <Table onRowSelection={rows => this.setState({ selectedRows: rows })} >
                    <TableHeader>
                        <TR>
                            <TH>{"Id"}</TH>
                            <TH>{"Customer Name"}</TH>
                            <TH>{"Line Item Summary"}</TH>
                            <TH>{"Status"}</TH>
                        </TR>
                    </TableHeader>
                    <TableBody deselectOnClickaway={false}>
                        {this.props.dashboard.orders.map((o, i) => (
                            <TR key={o.id} selected={this.rowIsSelected(i)} >
                                <TD>{o.order_number}</TD>
                                <TD>{`${o.customer.first_name} ${o.customer.last_name}`}</TD>
                                <TD>{this.getLineDescription(o)}</TD>
                                <TD>{o.closed_at ? `Closed on ${new Date(o.closed_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : "Open"}</TD>
                            </TR>
                        ))}
                    </TableBody>
                </Table>
            )
        };

        if (this.state.selectedRows && this.state.selectedRows.length > 0) {
            const order: Models.Order = this.props.dashboard.orders[this.state.selectedRows[0]];
            const rawTheme = theme.rawTheme.palette;
            const toolbarStyle = {
                backgroundColor: rawTheme.primary2Color,
                borderColor: rawTheme.borderColor,
            }
            const groupStyle = {
                alignItems: "center"
            }

            toolbar = (
                <Toolbar
                    className="sticked-toolbar"
                    style={toolbarStyle}>
                    <ToolbarGroup firstChild={true}>
                        <DropDownMenu
                            value={!!order.closed_at ? "closed" : "open"}
                            onChange={(e, i, v) => this.toggleStatus(order.id, order.closed_at ? "open" : "closed")}
                            labelStyle={{ color: rawTheme.alternateTextColor }}>
                            <MenuItem value={"open"} primaryText="Open" />
                            <MenuItem value={"closed"} primaryText="Closed" />
                        </DropDownMenu>
                    </ToolbarGroup>
                    <ToolbarGroup style={groupStyle}>
                        <IconButton
                            iconStyle={{ color: rawTheme.alternateTextColor }}
                            title="Unselect All"
                            onTouchTap={e => this.setState({ selectedRows: [] })}>
                            <SelectAllIcon />
                        </IconButton>
                        <IconMenu iconButtonElement={<IconButton iconStyle={{ color: rawTheme.alternateTextColor }} title="Delete"><DeleteIcon /></IconButton>}>
                            <MenuItem primaryText="Delete Order" onTouchTap={e => this.deleteOrder(order.id)} />
                        </IconMenu>
                    </ToolbarGroup>
                </Toolbar>
            );
        }

        return (
            <div>
                <section id="home" className="content">
                    <h2 className="content-title">{`Latest Orders for ${this.props.auth.session.shopify_shop_name}`}</h2>
                    {body}
                </section>
                <FloatingActionButton title="New Order" onClick={e => this.setState({ dialogOpen: true })} style={{ position: "fixed", right: "50px", bottom: "75px" }}>
                    <AddIcon />
                </FloatingActionButton>
                {toolbar}
                {this.state.error ? <Snackbar open={true} autoHideDuration={10000} message={this.state.error} onRequestClose={e => this.closeErrorSnackbar(e)} /> : null}
                <NewOrderDialog apiToken={this.props.auth.token} open={this.state.dialogOpen} onRequestClose={() => this.setState({ dialogOpen: false })} />
            </div>
        );
    }
}