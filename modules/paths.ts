export const Paths = {
    home: {
        index: "/",
    },
    account: {
        index: "/account"
    },
    auth: {
        login: "/auth/login",
        logout: "/auth/logout",
        forgotPassword: "/auth/forgot-password",
    },
    signup: {
        index: "/signup",
        integrate: "/signup/integrate",
        finalizeIntegration: "/signup/integrate/finalize",
    }
}

export default Paths;

/**
 * Returns a regex for the given path. Should be passed a path from the default module export, not a user-input path.
 */
export function getPathRegex(path: string) {
    let output: RegExp;

    switch (path) {
        default: 
            throw new Error("Given path does not have a known regex.");

        case Paths.auth.login:
            output = /\/auth\/login\/?$/i;
        break;
        
        case Paths.auth.logout:
            output = /\/auth\/logout\/?$/i;
        break;

        case Paths.auth.forgotPassword:
            output = /\/auth\/forgot-password\/?$/i;
        break;

        case Paths.home.index:
            output = /\/?$/i;
        break;

        case Paths.signup.index:
            output = /\/signup\/?$/i;
        break;

        case Paths.signup.integrate:
            output = /\/signup\/integrate\/?$/i;
        break; 

        case Paths.signup.finalizeIntegration:
            output = /\/signup\/integrate\/finalize\/?$/i;
        break;

        case Paths.account.index:
            output = /\/account\/?$/i;
        break;
    }

    return output;
}