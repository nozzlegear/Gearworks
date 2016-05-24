# Gearworks

Gearworks is a template for new Shopify apps using the "HNTR" stack — Hapi + Node + Typescript + React. Gearworks is fully equipped for handling Shopify's OAuth process, subscription billing and webhooks.

**This app template is a work in progress. Please check back soon!**

## Documentation

Note: docs are incomplete and only serve as notes for the real documentation once the template reaches v1.

**Q**: My users can't log in!

**A**: If your users can't log in (even after confirming that their username and password is correct), the most likely problem is that the auth cookie is not being set because their connection is not secure. Gearworks uses [yar](https://github.com/hapijs/yar) to handle auth cookies, and it's configured to only set those cookies when the connection is secure (i.e. http**s**://mydomain.com). You can fix this in two different ways:
1. Force all login requests to a secure domain (i.e. http**s**://mydomain.com).
2. Disable secure cookies by setting the yar plugin's `isSecure` option to `false` in `server.ts`.