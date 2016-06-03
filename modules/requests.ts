/// <reference path="./../typings/index.d.ts" />

import {Request} from "hapi";

/**
 * Returns the request's protocol (e.g. https) by trying to read the x-forwarded-proto header. This is the protocol the user typed into their address bar.
 * Useful when your server doesn't serve requests directly, but rather passes them through a proxy to your app.
 */
export function getRequestProtocol(request: Request)
{
    return (request.headers['x-forwarded-proto'] || request.connection.info.protocol);
}

/**
 * Returns the request's host + port (e.g. www.example.com). This is the host the user typed into their address bar.
 * Useful when your server doesn't serve requests directly, but rather passes them through a proxy to your app.
 */
export function getRequestHost(request: Request)
{
    return request.info.host;
}

/**
 * Returns the request's protocol + host (e.g. https://www.example.com). This is the domain the user typed into their address bar.
 * Useful when your server doesn't serve requests directly, but rather passes them through a proxy to your app.
 */
export function getRequestDomain(request: Request)
{
    const protocol = getRequestProtocol(request);
    const host = getRequestHost(request);
    
    return `${protocol}://${host}`
}