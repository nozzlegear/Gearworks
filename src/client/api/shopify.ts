import * as Requests from 'app/requests/shopify';
import BaseService from 'gearworks-http';
import { AUTH_HEADER_NAME } from '../../shared/constants';
import { Models as Shopify } from 'shopify-prime';
import { SessionTokenResponse } from 'gearworks-route/bin';

export class ShopifyApi extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/shopify", !!authToken ? { [AUTH_HEADER_NAME]: authToken } : undefined);
    }

    public createAuthorizationUrl = (data: Requests.GetOauthUrl) => this.sendRequest<{ url: string }>("url", "GET", { qs: data });

    public authorize = (data: Requests.Authorize, fullQueryString: string) => this.sendRequest<SessionTokenResponse>(`authorize?${fullQueryString.replace(/^\?/, "")}`, "POST", { body: data });

    public listOrders = (data: Requests.ListOrders) => this.sendRequest<Shopify.Order[]>(`orders`, "GET", { qs: data });

    public getOrder = (id: number | string) => this.sendRequest<Shopify.Order>(`orders/${id}`, "GET");

    public createOrder = (data: Requests.CreateOrder) => this.sendRequest<Shopify.Order>("orders", "POST", { body: data });

    public openOrder = (id: string | number) => this.sendRequest<Shopify.Order>(`orders/${id}/open`, "POST");

    public closeOrder = (id: string | number) => this.sendRequest<Shopify.Order>(`orders/${id}/close`, "POST");

    public deleteOrder = (id: string | number) => this.sendRequest<void>(`orders/${id}`, "DELETE");
}