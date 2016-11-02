import * as React from 'react';
import { render } from "react-dom";

export interface IProps extends React.Props<any> {
    
}

export interface IState {
    
}

export default class App extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
        
        this.configureState(props, false);
    }
    
    public state: IState = {};
    
    //#region Utility functions
    
    private configureState(props: IProps, useSetState: boolean) {
        let state: IState = {}
        
        if (!useSetState) {
            this.state = state;
            
            return;
        }
        
        this.setState(state);
    }
    
    //#endregion
    
    public componentDidMount() {
        
    }
    
    public componentDidUpdate() {
        
    }
    
    public componentWillReceiveProps(props: IProps) {
        this.configureState(props, true);
    }
    
    public render() {
        return (
            <div>
                <h1>{"Hello world!"}</h1>
            </div>
        );
    }
}

render(<App />, document.getElementById("contenthost"));