import { Models } from "shopify-prime";
import { resolve, reject } from "bluebird";
import { stringify as queryString } from "qs";
import { CreateOrderRequest } from "gearworks/requests";

// Interfaces
import Order = Models.Order;

export interface ApiError {
    details?: any;
    message?: string;
    unauthorized?: boolean;
}

export interface ApiResult<T> {
    data: T,
    body: string,
    error?: ApiError,
    ok: boolean,
    url: string,
    status: number,
    statusText: string,
}

export interface SessionTokenResponse {
    token: string;
}

export default class BaseService {
    constructor(private basePath?: string, private authToken?: string) { }

    protected async sendRequest<T>(path: string, method: "POST" | "PUT" | "GET" | "DELETE", data?: any) {
        const url = `${this.basePath}/${path}${method === "GET" ? ("?" + queryString(data)) : ""}`.replace(/\/\/+/i, "/");
        const request = resolve(fetch(url, {
            method: method,
            headers: {
                "Content-Type": data ? "application/json" : undefined,
                "x-gearworks-token": this.authToken || undefined,
            },
            body: (method !== "GET" && data) ? JSON.stringify(data) : undefined,
        }));

        let result: Response;
        let parsedBody: T;
        let textBody: string;

        try {
            result = await request;
        }
        catch (e) {
            // Fetch only throws an error when a network error is encountered.
            console.error(`There was a problem the fetch operation for ${url}`, e);

            throw e;
        }

        try {
            textBody = await result.text();
        }
        catch (e) {
            console.error(`There was a problem while reading the result's body text for ${url}`, e);
        }

        try {
            parsedBody = JSON.parse(textBody || "{}");
        }
        catch (e) {
            console.error(`There was a problem while parsing the result's JSON for ${url}`, e);
        }

        let output: ApiResult<T> = {
            data: parsedBody,
            body: textBody,
            ok: result.ok,
            url: result.url,
            status: result.status,
            statusText: result.statusText,
        };

        if (!result.ok) {
            console.error(new Date().toString(), result);

            const defaultMessage = "Something went wrong and your request could not be completed.";
            const error: ApiError = {
                unauthorized: result.status === 401,
            }

            try {
                const response: { message: string, details: { key: string, errors: string[] }[] } = JSON.parse(output.body || "{}");

                error.message = Array.isArray(response.details) ? response.details.map(e => e.errors.join(", ")).join(", ") : response.message;
                error.details = response.details;
            } catch (e) {
                console.error("Could not parse response's error JSON.", e, error, output.body);

                error.message = defaultMessage;
            }

            error.message = error.message || defaultMessage;
            output.error = error;
        }

        return output;
    }
}

export class Users extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/accounts", authToken);
    }

    public create = (data: { username: string, password: string }) => this.sendRequest<SessionTokenResponse>("", "POST", data);
}

export class Shopify extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/integrations/shopify", authToken);
    }

    public createAuthorizationUrl = (data: { shop_domain: string; redirect_url: string }) => this.sendRequest<{ url: string }>("url", "GET", data);

    public authorize = (data: { code: string, shop: string, hmac: string, state?: string }) => this.sendRequest<SessionTokenResponse>("authorize", "POST", data);

    public listOrders = (data: { limit?: number; page?: number; } = {}) => this.sendRequest<Order[]>(`orders`, "GET", data);

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