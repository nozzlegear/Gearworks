import * as React from 'react';
import { History } from "history";
import { Router } from "react-router";
import { AuthStore } from "../stores/auth";
import { DashboardStore } from "../stores/dashboard";
import { AutoPropComponent } from "auto-prop-component";

interface StoreProps {
    auth?: AuthStore,
    dashboard?: DashboardStore, 
}

abstract class ObserverComponent<IProps, IState> extends AutoPropComponent<IProps & StoreProps, IState> {
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
