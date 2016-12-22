// Material-UI needs the react-tap-event-plugin activated
const injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

import * as React from "react";
import { Provider } from "mobx-react";
import { APP_NAME } from "./modules/constants";
import { render as renderComponent } from "react-dom";
import Paths, { getPathRegex } from "./modules/paths";
import { Router, Redirect, Link, Route, IndexRoute, browserHistory, RouterContext } from "react-router";

// Stores
import { Auth as AuthStore } from "./stores";

// Layout components
import Navbar from "./components/nav";
import ErrorPage from "./pages/error";

// Auth components
import AuthPage from "./pages/auth";
import ResetPasswordPage from "./pages/auth/reset_password";
import ForgotPasswordPage from "./pages/auth/forgot_password";

// Signup components
import SignupPage from "./pages/signup";
import IntegratePage from "./pages/signup/integrate";
import FinalizeIntegrationPage from "./pages/signup/finalize";

// Home components
import HomePage from "./pages/home";

// Account components
import AccountPage from "./pages/account";

// Styles
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
require("purecss/build/pure.css");
require("purecss/build/grids-responsive.css");
require("typebase.css/typebase.css");
require("css/theme.styl");
require("css/error.styl");
require("css/utilities.styl");

export const theme = getMuiTheme(baseTheme);

// Main app component
export default function Main(props) {
    return (
        <main id="app"> 
            <Navbar />
            {React.cloneElement(props.children, props)}
            <footer id="footer">
                <div>
                    <p>
                        {`© ${APP_NAME}, ${new Date().getUTCFullYear()}. All rights reserved.`}
                    </p>
                    <p>
                        {"Powered by "}
                        <a target="_blank" href="https://github.com/nozzlegear/gearworks">
                            {"Gearworks"}
                        </a>
                        {"."}
                    </p>
                </div>
            </footer>
        </main>
    )
}

export function MinimalMain(props) {
    return (
        <main id="app" className="minimal"> 
            <div id="body">
                <div className="page-header">
                    <h1>
                        <Link to={Paths.home.index}>{APP_NAME}</Link>
                    </h1>
                </div>
                {React.cloneElement(props.children as any, props)}
            </div>
        </main>
    )
}

(function (){
    function checkAuthState(requireShopifyIntegration: boolean) {
        return (args: Router.RouterState, replace: Router.RedirectFunction, callback: Function) => {
            if (AuthStore.sessionIsInvalid) {
                replace(Paths.auth.login + window.location.search);
            } else if (requireShopifyIntegration && !AuthStore.session.shopify_access_token) {
                replace(Paths.signup.integrate + window.location.search);
            }

            callback();
        }
    }

    function logout(args: Router.RouterState, replace: Router.RedirectFunction, callback: Function) {
        AuthStore.logout();
        replace(Paths.auth.login);

        callback();
    }

    const routes = (
        <Provider {...{ auth: AuthStore }}>
            <MuiThemeProvider muiTheme={theme}>
                <Router history={browserHistory}>
                    <Route component={Main}>
                        <Route onEnter={checkAuthState(true)} >
                            <Route path={Paths.home.index} component={HomePage} onEnter={args => document.title = APP_NAME} />
                            <Route path={Paths.account.index} component={AccountPage} onEnter={args => document.title = "Your Account"} />
                        </Route>
                    </Route>
                    <Route component={MinimalMain}>
                        <Route path={Paths.auth.login} component={AuthPage} onEnter={(args) => {document.title = "Login"}} />
                        <Route path={Paths.auth.forgotPassword} component={ForgotPasswordPage} onEnter={args => document.title = "Forgot your password?"} />
                        <Route path={Paths.auth.resetPassword} component={ResetPasswordPage} onEnter={args => document.title = "Reset your password."} /> 
                        <Route path={Paths.signup.index} component={SignupPage} onEnter={args => document.title = "Signup"} />
                        <Route onEnter={checkAuthState(false)}>
                            <Route path={Paths.signup.integrate} component={IntegratePage} onEnter={args => document.title = "Connect your Shopify store."} />
                            <Route path={Paths.signup.finalizeIntegration} component={FinalizeIntegrationPage} onEnter={args => document.title = "Connecting your Shopify store."} />
                        </Route>
                        <Route path={"/error/:statusCode"} component={ErrorPage} onEnter={(args) => {document.title = `Error ${args.params["statusCode"]} | ${APP_NAME}`}} />
                    </Route>
                    <Route path={Paths.auth.logout} onEnter={logout} />
                    <Redirect path={"*"} to={"/error/404"} />
                </Router>
            </MuiThemeProvider>
        </Provider>
    )

    renderComponent(routes, document.getElementById("contenthost"));
}())