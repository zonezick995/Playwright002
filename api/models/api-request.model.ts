export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type ApiRequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  bodyParams?: Record<string, any>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  parseJson?: boolean;
  returnResponse?: boolean;
  body?: any;
};
