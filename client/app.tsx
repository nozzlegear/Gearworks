// Import the babel-polyfill at the top of the application
const polyfill = require("babel-polyfill");

// Material-UI needs the react-tap-event-plugin activated
const injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

import * as React from "react";
import { Provider } from "mobx-react";
import { APP_NAME } from "../modules/constants";
import { render as renderComponent } from "react-dom";
import Paths, { getPathRegex } from "../modules/paths";
import { Router, Redirect, Link, Route, IndexRoute, browserHistory, RouterContext } from "react-router";

// Stores
import { Auth as AuthStore } from "./stores";

// Layout components
import Navbar from "./components/nav";
import ErrorPage from "./pages/error";

// Auth components
import AuthPage from "./pages/auth";

// Signup components
import SignupPage from "./pages/signup";
import IntegratePage from "./pages/signup/integrate";
import FinalizeIntegrationPage from "./pages/signup/finalize";

// Home components
import HomePage from "./pages/home";

// Account components
import AccountPage from "./pages/account";

// Styles
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
require("../node_modules/purecss/build/pure.css");
require("../node_modules/typebase.css/typebase.css");
require("../css/theme.styl");

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
                    <Link to={Paths.home.index}>{APP_NAME}</Link>
                </div>
                {React.cloneElement(props.children as any, props)}
            </div>
        </main>
    )
}

{
    function checkAuthState(args: Router.RouterState, replace: Router.RedirectFunction, callback: Function) {
        if (AuthStore.sessionIsInvalid) {
            console.log("User's auth token is invalid.");
            replace(Paths.auth.login);
        }

        callback();
    }

    function logout(args: Router.RouterState, replace: Router.RedirectFunction, callback: Function) {
        AuthStore.logout();
        replace(Paths.auth.login);

        callback();
    }

    const routes = (
        <Provider {...{ auth: AuthStore }}>
            <MuiThemeProvider>
                <Router history={browserHistory}>
                    <Route component={Main}>
                        <Route onEnter={checkAuthState} >
                            <Route path={Paths.home.index} component={HomePage} onEnter={args => document.title = APP_NAME} />
                            <Route path={Paths.account.index} component={AccountPage} onEnter={args => document.title = "Your Account"} />
                        </Route>
                    </Route>
                    <Route component={MinimalMain}>
                        <Route path={Paths.auth.login} component={AuthPage} onEnter={(args) => {document.title = "Login"}} />
                        <Route path={Paths.signup.index} component={SignupPage} onEnter={args => document.title = "Signup"} />
                        <Route onEnter={checkAuthState}>
                            <Route path={Paths.signup.integrate} component={IntegratePage} onEnter={args => document.title = "Connect your Shopify store"} />
                            <Route path={Paths.signup.finalizeIntegration} component={FinalizeIntegrationPage} onEnter={args => document.title = "Connecting your Shopify store"} />
                        </Route>
                    </Route>
                    <Route path={Paths.auth.logout} onEnter={logout} />
                    <Route path={"/error/:statusCode"} component={ErrorPage} onEnter={(args) => {document.title = `Error ${args.params["statusCode"]} | ${APP_NAME}`}} />
                    <Redirect path={"*"} to={"/error/404"} />
                </Router>
            </MuiThemeProvider>
        </Provider>
    )

    renderComponent(routes, document.getElementById("contenthost"));
}