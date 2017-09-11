import * as Requests from 'app/requests/users';
import BaseService from 'gearworks-http';
import { AUTH_HEADER_NAME } from '../../shared/constants';
import { SessionTokenResponse } from 'gearworks-route/bin';

export class UsersApi extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/users", !!authToken ? { [AUTH_HEADER_NAME]: authToken } : undefined);
    }

    public create = (data: Requests.CreateOrUpdateAccount) => this.sendRequest<SessionTokenResponse>("", "POST", { body: data });

    public forgotPassword = (data: Requests.ForgotPassword) => this.sendRequest<void>("password/forgot", "POST", { body: data });

    public resetPassword = (data: Requests.ResetPassword) => this.sendRequest<void>("password/reset", "POST", { body: data });

    public changePassword = (data: Requests.UpdatePassword) => this.sendRequest<SessionTokenResponse>("password", "PUT", { body: data });

    public changeUsername = (data: Requests.CreateOrUpdateAccount) => this.sendRequest<SessionTokenResponse>("username", "PUT", { body: data });
}