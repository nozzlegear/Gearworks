import * as React from "react";

require("css/box.styl");

export interface IProps extends React.Props<any> {
    title: string;
    description?: string; 
    error?: string;
    footer?: JSX.Element;
}

export default function Box(props: IProps) {
    return (
        <div className="box blue">
            <div className="panel active">
                <div className="header">
                    <h4>{props.title}</h4>
                    {props.description ? <p>{props.description}</p> : null}
                </div>
                <div className="body">
                    {props.children}
                </div>
                {props.error ? <p className="error">{props.error}</p> : null}
                <div className="footer">
                    {props.footer}
                </div>
            </div>
        </div>
    )
}