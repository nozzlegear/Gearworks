import * as React from 'react';
import Box from '../../components/box';
import Router from '../../components/router';
import store from '../../stores/auth';
import { ApiError, Shopify } from '../../modules/api';
import { APP_NAME } from '../../modules/constants';
import { FontIcon, RaisedButton, TextField } from 'material-ui';

export interface IProps {

}

export interface IState {
    loading?: boolean;
    error?: string;
}

export default class IntegratePage extends Router<IProps, IState> {
    constructor(props: IProps, context) {
        super(props, context);

        this.configureState(props, false);
    }

    public state: IState = {};

    private urlControl: TextField;

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

    private async createAccount(e: React.MouseEvent<any> | React.FormEvent<any>) {
        e.preventDefault();

        const {loading} = this.state;
        const shopUrl = this.urlControl.getValue();
        const api = new Shopify(store.token);

        if (loading) {
            return;
        }

        this.setState({ loading: true, error: undefined });

        // Verify the shop url first
        try {
            const result = await api.createAuthorizationUrl({
                shop_domain: shopUrl,
                redirect_url: `${window.location.protocol}//${window.location.host}${this.PATHS.signup.finalizeIntegration}`,
            });

            // Send the user to the integration URL
            window.location.href = result.url;
        } catch (e) {
            const err: ApiError = e;

            if (err.unauthorized && this.handleUnauthorized(this.PATHS.signup.integrate)) {
                return;
            }

            this.setState({ loading: false, error: err.message });
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
        const {loading, error} = this.state;
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
                    <div className="pure-u-1-1 pure-u-md-12-24">
                        <Box title={`Connect your Shopify store.`} footer={actions} error={error}>
                            <div className="form-group">
                                <TextField
                                    fullWidth={true}
                                    floatingLabelText="Your Shopify store URL"
                                    type="text"
                                    hintText="https://example.myshopify.com"
                                    ref={c => this.urlControl = c} />
                            </div>
                        </Box>
                    </div>
                </div>
            </section>
        );
    }
}