import * as React from 'react';
import store from "../../stores/auth";
import Box from "../../components/box";
import { SessionToken } from "gearworks";
import { Paths } from "../../../modules/paths";
import { APP_NAME } from "../../../modules/constants";
import { AutoPropComponent } from "auto-prop-component";
import { ApiResult, Shopify } from "../../../modules/api";
import { TextField, RaisedButton, FontIcon } from "material-ui";

export interface IProps {

}

export interface IState {
    shopUrl?: string;
    loading?: boolean;
    error?: string;
}

export default class IntegratePage extends AutoPropComponent<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    //#region Utility functions

    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {
            shopUrl: "",
        }

        if (!useSetState) {
            this.state = state;

            return;
        }

        this.setState(state);
    }

    //#endregion

    private async createAccount(e: React.MouseEvent<any> | React.FormEvent<any>) {
        e.preventDefault();

        const {shopUrl, loading} = this.state;
        const api = new Shopify(store.token);

        if (loading) {
            return;
        }

        this.setState({ loading: true, error: undefined });

        // Verify the shop url first
        try {
            const result = await api.verifyUrl({
                url: this.state.shopUrl
            });

            if (!result.ok || !result.data.isValid) {
                this.setState({ loading: false, error: result.ok ? "The URL you entered is not a valid Shopify store URL. Please double-check it and try again." : result.error.message });

                return;
            }
        } catch (e) {
            this.setState({ loading: false, error: "Something went wrong and we could not verify your Shopify URL." });

            return;
        }

        // Create an authorization url
        try {
            const result = await api.createAuthorizationUrl({
                url: this.state.shopUrl,
                redirectUrl: `${window.location.protocol}//${window.location.host}${Paths.signup.finalizeIntegration}`,
            });

            if (!result.ok) {
                this.setState({ loading: false, error: result.error.message });

                return;
            }

            window.location.href = result.data.url;
        } catch (e) {
            this.setState({ loading: false, error: "Something went wrong and we could not create an integration link for your Shopify store. Please try again." });

            return;
        }
    }

    public componentDidMount() {

    }

    public componentDidUpdate() {

    }

    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }

    public render() {
        const {shopUrl, loading, error} = this.state;
        const actions = (
            <RaisedButton
                fullWidth={true}
                primary={true}
                onTouchTap={e => this.createAccount(e)}
                label={loading ? "Connecting" : "Connect"}
                icon={loading ? <FontIcon className="fa fa-spinner fa-spin" /> : null} />);

        return (
            <section id="signup">
                <div className="pure-g center-children">
                    <div className="pure-u-12-24">
                        <Box title={`Connect your Shopify store.`} footer={actions} error={error}>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Your Shopify store URL"
                                    value={shopUrl}
                                    type="text"
                                    hintText="https://example.myshopify.com"
                                    onChange={this.updateStateFromEvent((s, v) => s.shopUrl = v)} />
                            </div>
                        </Box>
                    </div>
                </div>
            </section>
        );
    }
}