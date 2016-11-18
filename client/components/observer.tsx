import * as qs from "qs";
import Router from "./router";
import * as React from 'react';
import { History } from "history";
import { AuthStore } from "../stores/auth";
import { DashboardStore } from "../stores/dashboard";

interface StoreProps {
    auth?: AuthStore,
    dashboard?: DashboardStore, 
}

abstract class ObserverComponent<IProps, IState> extends Router<IProps & StoreProps, IState> {
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
}

export default ObserverComponent;
