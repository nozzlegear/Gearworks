/// <reference path="./../typings/index.d.ts" />

import {find} from "lodash";
import {Plan} from "gearworks";

/**
 * A list of plans that a new user can subscribe to, or a current user can switch to.
 * All plans in this list will appear on the pricing page.
 */
export const Plans: Plan[] = [
    {
        id: "0696abc9-43e2-4915-822a-895de5ede035",
        price: 9.00,
        name: "Basic",
        trialDays: 21,
        description: "In tempor aliqua sint ex duis nostrud ipsum enim fugiat excepteur sint mollit ex enim.",
        permissions: []
    },
    {
        id: "d3212ae5-78a9-4a8b-a6f4-01445b9b4f0a",
        price: 29.00,
        name: "Professional",
        trialDays: 21,
        description: "Quis ullamco fugiat laboris ipsum proident tempor Lorem ipsum eiusmod incididunt irure.",
        permissions: []
    },
    {
        id: "46214500-1a92-445d-af1e-45207ba8c4ed",
        price: 59.00,
        name: "Business",
        trialDays: 21,
        description: "Ipsum ullamco aute ea reprehenderit consectetur velit quis elit nisi sunt reprehenderit.",
        permissions: []
    },
]

/**
 * A list of plans that were previously available and possibly still in use by one or more users.
 * No plan in this list will appear on the pricing page.
 */
export const RetiredPlans: Plan[] = [
    
]

/**
 * Finds a plan with the given id, whether it's a current or retired plan.
 */
export function findPlan(id: string) 
{
    const plan = find(Plans, p => p.id === id) || find(RetiredPlans, p => p.id === id);
    
    if (!plan)
    {
        throw new Error(`Unable to find plan with id of ${id}.`);
    }
    
    return plan;
}