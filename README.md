# Gearworks

Gearworks is a template for new Shopify apps using the "HNTR" stack — Hapi + Node + Typescript + React. Gearworks is fully equipped for handling Shopify's OAuth process, subscription billing and webhooks.

**This app template is a work in progress. Please check back soon!**

![Gearworks](https://i.imgur.com/DbtWFY5.gif)

## Documentation

Note: docs are incomplete and only serve as notes for the real documentation once the template reaches v1.

**Q**: My users can't log in!

**A**: If your users can't log in (even after confirming that their username and password is correct), the most likely problem is that the auth cookie is not being set because their connection is not secure. Gearworks uses [yar](https://github.com/hapijs/yar) to handle auth cookies, and it's configured to only set those cookies when the connection is secure (i.e. http**s**://mydomain.com). You can fix this in two different ways:

1. Force all login requests to a secure domain (i.e. http**s**://mydomain.com).
2. Disable secure cookies by setting the yar plugin's `isSecure` option to `false` in `server.ts`.

---

**Q**: I get a 403 forbidden response whenever a form is submitted!

**A:**: Gearworks uses [Crumb](https://npmjs.com/package/crumb) for quick, easy and secure protection against common Cross-site Request Forgery (CSRF) attacks. Crumb's goal is to help prevent malicious code from executing via HTTP requests. To do this, Crumb issues a secure token value in a cookie on every request, and then compares that value with a another secure token that gets sent back to the server when a form is submitted. If those values don't line up, Crumb returns a 403 Forbidden response to prevent a CSRF attack.

If you're running into problems with Crumb validation, you probably forgot to send the Crumb token back to the server when your form submits. Crumb gives passes that token to your React view through `props.crumb`, and Gearworks has a special component named `Crumb` to render the necessary form field:   

```js
import {Crumb} from "../crumb"; //Crumb component is located at views/crumb.tsx

export default function MyForm(props: {crumb: string})
{
    return (
        <form method="POST">
            <Crumb value={props.crumb} />
        </form>
    )
}
```

If you don't want to use the recommended `Crumb` component, just create a hidden input with the name `crumb` and the token value:

```js
export default function MyForm(props: {crumb: string})
{
    return (
        <form method="POST">
            <input type="hidden" name="crumb" value={props.crumb} />
        </form>
    )
}
```

## Building Gearworks

- Gearworks requires a PouchDB-compatible database. For development, Gearworks assumes that you have [pouchdb-server](https://github.com/pouchdb/pouchdb-server) installed globally via NPM.