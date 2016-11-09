import * as React from "react";
import { Link } from "react-router";
import Paths from "../../../modules/paths";
import { Location, History } from "history";
import { APP_NAME } from "../../../modules/constants";

require("../../css/error.styl");

export interface IProps extends React.Props<any> {
    location: Location;
    params: {
        statusCode: string;
    }
    history: History;
}

export default function Error(props: IProps) {
    const description = props.params.statusCode === "404" ? "Not found" : "Application Error";

    return (
        <section id="error">
            <h1 className="logo">
                <Link to={Paths.home.index}>
                    {APP_NAME}
                </Link>
            </h1>
            <div className="error">
                <h2>
                    {"Oops!"}
                </h2>
                <h3>{`${description}.`}</h3>
                <Link className="back" to={Paths.home.index} style={{ "color": "#fff", "textDecoration": "underline" }} >
                    {"Click here to go back to the home page."}
                </Link>
            </div>
        </section>
    )
}