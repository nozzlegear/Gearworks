// Import the babel-polyfill at the top of the application
const polyfill = require("babel-polyfill");

// Material-UI needs the react-tap-event-plugin activated
const injectTapEventPlugin = require("react-tap-event-plugin");
injectTapEventPlugin();

import * as React from "react";
import { Provider } from "mobx-react";
import { render as renderComponent } from "react-dom";
import Paths, { getPathRegex } from "../modules/paths";
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import { Router, Redirect, Link, Route, IndexRoute, browserHistory, RouterContext } from "react-router";

// Stores
import { Auth as AuthStore } from "./stores";

// Layout components
import Navbar from "./components/nav";
import Error from "./pages/error";

// Auth components
import Auth from "./pages/auth";

// Portraits
import Portraits from "./pages/portraits";

// Art
import Art from "./pages/art";

// Aurora
import Aurora from "./pages/aurora";
import AuroraHistory from "./pages/aurora/history";

// FTP
import FtpUpload from "./pages/ftp/upload";
import FtpManage from "./pages/ftp/manage";

// Styles
require("./css/overrides.scss");
require("./css/theme.scss");
require("./css/universal.scss");
require("./css/table.scss");

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

    function WithNav(props) {
        return (
            <div>
                <Navbar />
                <div id="body">
                    {React.cloneElement(props.children, props)}
                </div>
                <Footer />
            </div>
        )
    }

    const routes = (
        <Provider {...{ auth: AuthStore }}>
            <MuiThemeProvider>
                <main id="app">
                    <Router history={browserHistory}>
                        <Redirect path={"/"} to={Paths.portraits.index} />
                        <Route path={Paths.auth.login} component={Auth} onEnter={(args) => {document.title = "Login | KMSignalR"}} />
                        <Route path={Paths.auth.logout} onEnter={logout} />
                        <Route path={Paths.ftp.index} component={FtpUpload} onEnter={(args) => {document.title = "Upload File | KMSignalR"}} />
                        <Route onEnter={checkAuthState} component={WithNav} onChange={(prevState, nextState, replace, callback) => {console.log("AuthState router triggered onChange event."); callback()}} >
                            <Route path={Paths.portraits.index} component={Portraits} onEnter={(args) => {document.title = "Portrait Orders | KMSignalR"}} />
                            <Route path={Paths.art.index} component={Art} onEnter={(args) => {document.title = "Art Department Orders | KMSignalR"}} />
                            <Route path={Paths.aurora.index} component={Aurora} onEnter={(args) => {document.title = "Aurora Orders | KMSignalR"}} />
                            <Route path={Paths.aurora.history} component={AuroraHistory} onEnter={args => {document.title = "Aurora History | KMSignalR"}} />
                            <Route path={Paths.ftp.manage} component={FtpManage} onEnter={(args) => {document.title = "Manage FTP Uploads | KMSignalR"}} />
                        </Route>
                        <Route path={"/error/:statusCode"} component={Error} onEnter={(args) => {document.title = `Error ${args.params["statusCode"]} | KMSignalR`}} />
                        <Redirect path={"*"} to={"/error/404"} />
                    </Router>
                </main>
            </MuiThemeProvider>
        </Provider>
    )

    renderComponent(routes, document.getElementById("contenthost"));
}