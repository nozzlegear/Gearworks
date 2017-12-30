import * as process from 'process';

// Env will be injected by parcel when running on the frontend.
const env = process && process.env || {};

export function envVar(key: string): string {
    return env[key];
}

export function envVarDefault(key: string, defaultValue: string): string {
    return envVar(key) || defaultValue;
}

export function envVarRequired(key: string): string {
    const value = envVar(key);

    if (!value) {
        throw new Error(`Required environment variable "${key}" was not found.`)
    }

    return value;
}

export const APP_NAME = "Gearworks";

export const ISLIVE = env.NODE_ENV === "production";

export const AUTH_HEADER_NAME = "x-gearworks-token";