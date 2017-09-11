import * as React from 'react';
import Paths from '../../../shared/paths';
import { APP_NAME } from '../../../shared/constants';
import { History, Location } from 'history';
import { Link } from 'react-router';

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