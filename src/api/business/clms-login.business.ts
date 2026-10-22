import { ApiService } from '../services/api.service';

export type ClmsCredentials = {
  username: string;
  password: string;
};

export const loginToClms = (
  api: typeof ApiService,
  baseUrl: string,
  credentials: ClmsCredentials,
) => {
  return api.post(`${baseUrl}/login`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Channel': 'WEB',
      'X-Request-Id': crypto.randomUUID(),
    },
    body: {
      requestTrace: crypto.randomUUID(),
      requestDateTime: new Date().toISOString(),
      requestParameters: {
        username: ':user',
        password: ':pass',
      },
    },
    bodyParams: {
      user: credentials.username,
      pass: credentials.password,
    },
  });
};
