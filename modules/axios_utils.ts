import Axios, { AxiosResponse } from "axios";

// Like fetch, Axios should never throw an error if it receives a response
Axios.defaults.validateStatus = (status) => true;

/**
 * Indicates whether the request was a success or not (between 200-300).
 */
export function isOkay(response: AxiosResponse) {
    return response.status >= 200 && response.status < 300;
}

export default isOkay;