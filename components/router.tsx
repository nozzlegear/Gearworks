import * as qs from "qs";
import * as React from "react";
import { History } from "history";
import store from "../stores/auth";
import * as Bluebird from "bluebird";
import Paths from "../modules/paths";

abstract class RouterComponent<IProps, IState> extends React.Component<IProps, IState> {
    constructor(props, context) {
        super(props, context);
    }

    static contextTypes = {
        router: React.PropTypes.object
    }

    public context: {
        router: History;
    }

    public state: IState;

    public PATHS = Paths;

    /**
     * Notifies the user that their account has been logged out, and that they must log in again before their request can be made. Returns true if they accept the prompt to log in again, false if not.
     */
    public handleUnauthorized(redirectBackTo?: string, querystring?: Object) {
        if (confirm("Your account has been logged out, and you must log in again before your request can be made. Do you want to log in again?")) {
            window.location.search = qs.stringify({redirect: redirectBackTo, qs: querystring});
            
            store.logout();

            return true;
        }

        return false;
    }

    /**
     * An awaitable implementation of React's .setState function.
     */
    public setStateAsync(state: IState) {
        return new Bluebird<void>((res, rej) => {
            this.setState(state, res);
        })
    }
}

export default RouterComponent;