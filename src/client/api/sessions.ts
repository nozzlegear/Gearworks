import * as Requests from 'app/requests/sessions';
import BaseService from 'gearworks-http';
import { AUTH_HEADER_NAME } from '../../shared/constants';
import { SessionTokenResponse } from 'gearworks-route';

export class SessionsApi extends BaseService {
    constructor(authToken?: string) {
        super("/api/v1/sessions", !!authToken ? { [AUTH_HEADER_NAME]: authToken } : undefined);
    }

    public create = (data: Requests.CreateSession) => this.sendRequest<SessionTokenResponse>("", "POST", { body: data });
}