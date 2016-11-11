import * as Bluebird from "bluebird";
import { IRON_PASSWORD } from "./constants";
import { seal as ironSeal, unseal as ironUnseal, defaults } from "iron";

export function seal(value) {
    return new Bluebird<string>((res, rej) => {
        ironSeal(value, IRON_PASSWORD, defaults, (err, token) => {
            if (err) {
                return rej(err);
            }

            return res(token);
        })
    });
}

export function unseal<T>(token: string) {
    return new Bluebird<T>((res, rej) => {
        ironUnseal(token, IRON_PASSWORD, defaults, (err, data) => {
            if (err) {
                return rej(err);
            }

            return res(data as T);
        })
    });
}