import * as React from 'react';
import AccountPage from './pages/account';
import AuthPage from './pages/auth';
import baseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import createHistory from 'history/lib/createBrowserHistory';
import ErrorPage from './pages/error';
import FinalizeIntegrationPage from './pages/signup/finalize';
import ForgotPasswordPage from './pages/auth/forgot_password';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import HomePage from './pages/home';
import IntegratePage from './pages/signup/integrate';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import Navbar from './components/nav';
import Paths from '../shared/paths';
import ResetPasswordPage from './pages/auth/reset_password';
import SignupPage from './pages/signup';
import { APP_NAME } from '../shared/constants';
import { AppContainer } from 'react-hot-loader';
import { AuthStore, DashboardStore } from './stores';
import {
    browserHistory,
    IndexRoute,
    Link,
    Redirect,
    Route,
    Router,
    RouterContext
    } from 'react-router';
import { Provider } from 'mobx-react';
import { render as renderComponent, unmountComponentAtNode } from 'react-dom';

require("react-hot-loader/patch");

try {
    // Material-UI needs the react-tap-event-plugin activated
    require("react-tap-event-plugin")();
} catch {
    // Ignore, HMR will call the plugin multiple times which will throw an error and prevent
    // any real HMR.
}

// Inject CSS
require("./css/all.styl")

export const THEME = getMuiTheme(baseTheme);
const history = browserHistory//createHistory();

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

(function () {
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
        <Route>
            <Route component={Main}>
                <Route onEnter={checkAuthState(true)} >
                    <Route path={Paths.home.index} component={HomePage} onEnter={args => document.title = APP_NAME} />
                    <Route path={Paths.users.index} component={AccountPage} onEnter={args => document.title = "Your Account"} />
                </Route>
            </Route>
            <Route component={MinimalMain}>
                <Route path={Paths.auth.login} component={AuthPage} onEnter={(args) => { document.title = "Login" }} />
                <Route path={Paths.auth.forgotPassword} component={ForgotPasswordPage} onEnter={args => document.title = "Forgot your password?"} />
                <Route path={Paths.auth.resetPassword} component={ResetPasswordPage} onEnter={args => document.title = "Reset your password."} />
                <Route path={Paths.signup.index} component={SignupPage} onEnter={args => document.title = "Signup"} />
                <Route onEnter={checkAuthState(false)}>
                    <Route path={Paths.signup.integrate} component={IntegratePage} onEnter={args => document.title = "Connect your Shopify store."} />
                    <Route path={Paths.signup.finalizeIntegration} component={FinalizeIntegrationPage} onEnter={args => document.title = "Connecting your Shopify store."} />
                </Route>
                <Route path={"/error/:statusCode"} component={ErrorPage} onEnter={(args) => { document.title = `Error ${args.params["statusCode"]} | ${APP_NAME}` }} />
            </Route>
            <Route path={Paths.auth.logout} onEnter={logout} />
            <Redirect path={"*"} to={"/error/404"} />
        </Route>
    )

    const render = (Component) => {
        renderComponent(
            <Component />,
            document.getElementById("contenthost")
        )
    }
    const App = () => (
        // There exists a bug in react-router, of course, that throws errors when trying to use HMR saying it won't
        // let you change the router's routes. To workaround, you must both use `routes={routes}` (rather than <Router><Route .../><Route .../></Router>)
        // *and* rerender the router from a function. You can't just render once and reuse it.
        <Provider>
            <MuiThemeProvider muiTheme={THEME}>
                <AppContainer>
                    <Router history={history} routes={routes} />
                </AppContainer>
            </MuiThemeProvider>
        </Provider>
    )

    render(App)

    if (module["hot"]) {
        module["hot"].accept(() => {
            console.log("HMR reloading entire app.")
            render(App)
        })
    }
}())