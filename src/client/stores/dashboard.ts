import { action, observable } from 'mobx';
import { Models } from 'shopify-prime';
import { uniqueId } from 'lodash';

class DashboardStoreFactory {
    constructor() {

    }

    @observable orders: Models.Order[] = [];

    @observable loaded = false;

    @action loadOrders(orders: Models.Order[]) {
        this.orders.push(...orders);
        this.loaded = true;
    }

    @action addOrder(order: Models.Order) {
        // Dashboard is sorted from newest to oldest. Add the new order to the top of the list.
        this.orders.unshift(order);
    }

    @action removeOrder(id: number) {
        const index = this.orders.findIndex(o => o.id === id);

        this.orders.splice(index, 1);
    }

    @action updateOrder(id: number, order: Models.Order) {
        const index = this.orders.findIndex(o => o.id === id);

        this.orders.splice(index, 1, order);
    }
}

export const DashboardStore = new DashboardStoreFactory();