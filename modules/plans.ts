/// <reference path="./../typings/index.d.ts" />

import {find} from "lodash";
import {Plan} from "gearworks";

/**
 * A list of plans that a new user can subscribe to, or a current user can switch to.
 * All plans in this list will appear on the pricing page.
 */
export const plans: Plan[] = [
    {
        id: "0696abc9-43e2-4915-822a-895de5ede035",
        interval: "month",
        price: 9.00,
        name: "Basic",
        description: "In tempor aliqua sint ex duis nostrud ipsum enim fugiat excepteur sint mollit ex enim.",
        permissions: []
    },
    {
        id: "d3212ae5-78a9-4a8b-a6f4-01445b9b4f0a",
        interval: "month",
        price: 29.00,
        name: "Professional",
        description: "Quis ullamco fugiat laboris ipsum proident tempor Lorem ipsum eiusmod incididunt irure.",
        permissions: []
    },
    {
        id: "46214500-1a92-445d-af1e-45207ba8c4ed",
        interval: "month",
        price: 59.00,
        name: "Business",
        description: "Ipsum ullamco aute ea reprehenderit consectetur velit quis elit nisi sunt reprehenderit.",
        permissions: []
    },
]

/**
 * A list of plans that were previously available and possibly still in use by one or more users.
 * No plan in this list will appear on the pricing page.
 */
export const retiredPlans: Plan[] = [
    
]

/**
 * Finds a plan with the given id, whether it's a current or retired plan.
 */
export function findPlan(id: string) 
{
    const plan = find(plans, p => p.id === id) || find(retiredPlans, p => p.id === id);
    
    if (!plan)
    {
        throw new Error(`Unable to find plan with id of ${id}.`);
    }
    
    return plan;
}