import * as React from "react";
import { render } from "react-dom";

export default class App extends React.Component<any, any> {
    constructor(props) {
        super(props);
        
        this.configureState(props, false);
    }
    
    //#region Utility functions
    
    configureState(props, useSetState) {
        let state = {}
        
        if (!useSetState) {
            this.state = state;
            
            return;
        }
        
        this.setState(state);
    }
    
    //#endregion
    
    componentDidMount() {
        
    }
    
    componentDidUpdate() {
        
    }
    
    componentWillReceiveProps(props) {
        this.configureState(props, true);
    }
    
    render() {
        return (
            <div>
                <h1>{"Hello world!"}</h1>
            </div>
        );
    }
}

render(<App />, document.getElementById("contenthost"));