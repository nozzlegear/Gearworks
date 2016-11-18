declare module "gearworks/requests" {
    // #region /integrations/shopify

    export interface CreateOrderRequest {
        city: string; 
        email: string; 
        line_item: string; 
        name: string; 
        quantity: number; 
        state: string; 
        street: string; 
        zip: string;
    }

    //#endregion
}