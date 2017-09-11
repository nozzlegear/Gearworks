export const paths = {
    api: {
        sessions: {
            base: "/api/v1/sessions/"
        },
        shopify: {
            base: "/api/v1/shopify/"
        },
        users: {
            base: "/api/v1/users/"
        },
        webhooks: {
            base: "/api/v1/webhooks/"
        }
    },
    home: {
        index: "/",
    },
    users: {
        index: "/users"
    },
    auth: {
        login: "/auth/login",
        logout: "/auth/logout",
        forgotPassword: "/auth/forgot-password",
        resetPassword: "/auth/reset-password",
    },
    signup: {
        index: "/signup",
        integrate: "/signup/integrate",
        finalizeIntegration: "/signup/integrate/finalize",
    }
}

export default paths;