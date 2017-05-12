import Axios, { AxiosResponse } from 'axios';
import inspect from 'logspect';
import isOkay from './axios_utils';
import { AUTH_HEADER_NAME } from './constants';
import { CreateOrderRequest } from 'gearworks/requests';
import { Models } from 'shopify-prime';
import { reject, resolve } from 'bluebird';

// Interfaces
import Order = Models.Order;

export interface SessionTokenResponse {
    token: string;
}

export class ApiError extends Error {
    constructor(body?: string | Object, axiosResponse?: AxiosResponse) {
        super("Something went wrong and your request could not be completed.");

        if (!!axiosResponse) {
            this.unauthorized = axiosResponse.status === 401;
            this.status = axiosResponse.status;
            this.statusText = axiosResponse.statusText;

            if (body) {
                try {
                    const response: { message: string, details: { key: string, errors: string[] }[] } = typeof (body) === "string" ? JSON.parse(body || "{}") : body;

                    this.message = Array.isArray(response.details) ? response.details.map(e => e.errors.join(", ")).join(", ") : response.message;
                    this.details = response.details;
                } catch (e) {
                    inspect("Could not read response's error JSON.", body);
                }
            }
        } else {
            // A network error occurred.
            this.status = 503;
            this.statusText = "Service Unavailable";
            this.unauthorized = false;
        }
    }

    public unauthorized: boolean;

    public status: number;

    public statusText: string;

    public details?: any;
}

export default class BaseService {
    constructor(private basePath?: string, private authToken?: string) { }

    protected async sendRequest<T>(path: string, method: "POST" | "PUT" | "GET" | "DELETE", bodyData?: any, qsData?: any) {
        const url = `${this.basePath}/${path}`.replace(/\/\/+/i, "/");
        const request = Axios({
            url,
            method: method,
            headers: {
                "Content-Type": bodyData ? "application/json" : undefined,
                [AUTH_HEADER_NAME]: this.authToken || undefined,
            },
            params: qsData,
            data: bodyData,
        });

        let result: AxiosResponse;
        let body: T;

        try {
            result = await request;
            body = result.data;
        }
        catch (e) {
            // Axios was configured to only throw an error when a network error is encountered.
            inspect(`There was a problem the fetch operation for ${url}`, e);

            throw new ApiError();
        }

        if (!isOkay(result)) {
            throw new ApiError(body, result);
        }

        return body;
    }
}

export class Users extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/accounts", authToken);
    }

    public create = (data: { username: string, password: string }) => this.sendRequest<SessionTokenResponse>("", "POST", data);

    public forgotPassword = (data: { username: string }) => this.sendRequest<void>("password/forgot", "POST", data);

    public resetPassword = (data: { reset_token: string; new_password: string; }) => this.sendRequest<void>("password/reset", "POST", data);

    public changePassword = (data: { new_password: string; old_password: string; }) => this.sendRequest<SessionTokenResponse>("password", "PUT", data);

    public changeUsername = (data: { password: string, username: string }) => this.sendRequest<SessionTokenResponse>("username", "PUT", data);
}

export class Shopify extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/integrations/shopify", authToken);
    }

    public createAuthorizationUrl = (data: { shop_domain: string; redirect_url: string }) => this.sendRequest<{ url: string }>("url", "GET", undefined, data);

    public authorize = (data: { code: string, shop: string, hmac: string, state?: string }, fullQueryString: string) => this.sendRequest<SessionTokenResponse>(`authorize?${fullQueryString.replace(/^\?/, "")}`, "POST", data);

    public listOrders = (data: { limit?: number; page?: number; } = {}) => this.sendRequest<Order[]>(`orders`, "GET", undefined, data);

    public getOrder = (id: number | string) => this.sendRequest<Order>(`orders/${id}`, "GET");

    public createOrder = (data: CreateOrderRequest) => this.sendRequest<Order>("orders", "POST", data);

    public openOrder = (id: string | number) => this.sendRequest<Order>(`orders/${id}/open`, "POST");

    public closeOrder = (id: string | number) => this.sendRequest<Order>(`orders/${id}/close`, "POST");

    public deleteOrder = (id: string | number) => this.sendRequest<void>(`orders/${id}`, "DELETE");
}

export class Sessions extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/sessions", authToken);
    }

    public create = (data: { username: string, password: string }) => this.sendRequest<SessionTokenResponse>("", "POST", data);
}