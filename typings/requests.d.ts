declare module "gearworks/requests/accounts" {
    export interface NewPassword {
        new_password: string;
    }

    export interface ResetPassword extends NewPassword{
        reset_token: string;
    }

    export interface UpdatePassword extends NewPassword{
        old_password: string;
    }

    export interface Username {
        username: string;
    }

    export interface CreateOrUpdateAccount extends Username{
        password: string;
    }
}

declare module "gearworks/requests/integrations" {
    export interface GetOauthUrl {
        shop_domain: string;
        redirect_url: string;
    }

    export interface Authorize {
        code: string;
        shop: string;
        hmac: string;
        state: string;
    }

    export interface ListOrders {
        limit: number;
        page: number;
        status: "any";
    }

    export interface CreateOrder {
        city: string;
        email: string;
        line_item: string;
        name: string;
        quantity: number;
        state: string;
        street: string;
        zip: string;
    }

    export interface OpenCloseDelete {
        id: number;
    }
}

declare module "gearworks/requests/sessions" {
    export interface CreateSession {
        username: string;
        password: string;
    }
}

declare module "gearworks/requests/webhooks" {
    export interface AppUninstalled {
        shop_id: string;
        shop: string;
    }
}