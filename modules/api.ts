import { Models } from "shopify-prime";
import { resolve, reject } from "bluebird";
import { stringify as queryString } from "qs";
import { CreateOrderRequest } from "gearworks/requests";

// Interfaces
import Order = Models.Order;

export class ApiError extends Error {
    constructor(body?: string, data?: Response) {
        super("Something went wrong and your request could not be completed.");

        if (!!data) {
            this.unauthorized = data.status === 401;
            this.status = data.status;
            this.statusText = data.statusText;

            if (body) {
                try {
                    const response: { message: string, details: { key: string, errors: string[] }[] } = JSON.parse(body || "{}");

                    this.message = Array.isArray(response.details) ? response.details.map(e => e.errors.join(", ")).join(", ") : response.message;
                    this.details = response.details;
                } catch (e) {
                    console.error("Could not parse response's error JSON.", body);
                }
            }
        } else {
            // A fetch error occurred.
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

            throw new ApiError();
        }

        try {
            textBody = await result.text();
            parsedBody = JSON.parse(textBody || "{}");
        } catch (e) {
            console.error("Could not read or parse body text.", e);

            throw new ApiError();
        }

        if (!result.ok) {
            throw new ApiError(textBody, result);
        }

        return parsedBody;
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

    public createAuthorizationUrl = (data: { shop_domain: string; redirect_url: string }) => this.sendRequest<{ url: string }>("url", "GET", data);

    public authorize = (data: { code: string, shop: string, hmac: string, state?: string }, fullQueryString: string) => this.sendRequest<SessionTokenResponse>(`authorize?${fullQueryString.replace(/^\?/, "")}`, "POST", data);

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