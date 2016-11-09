import { uniqueId } from "lodash";
import { findIndex } from "lodash"; 
import { Models } from "shopify-prime";
import { CouchResponse } from "gearworks";
import { observable, action } from "mobx";

export class DashboardStore {
    constructor() {
        
    }

    @observable orders: Models.Order[] = [];

    @observable loaded = false;

    @action loadOrders(orders: Models.Order[]) {
        this.orders = orders;
        this.loaded = true;
    }

    @action addOrder(orders: Models.Order) {
        this.orders.push(orders);
    }

    @action removeOrder(id: number) {
        const index = this.orders.findIndex(o => o.id === id);

        this.orders.splice(index, 1);
    }

    @action updateOrder(id: number, order: Models.Order) {

    }
}

const store = new DashboardStore();

export default store;