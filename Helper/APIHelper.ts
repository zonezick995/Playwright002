import { APIRequestContext, request } from '@playwright/test';
import { Logger } from './utils/logger';
import { AllureHelper } from './AllureHelper';

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  /**
   * Parameters to replace inside the request body (supports {{key}} or :key placeholders)
   */
  bodyParams?: Record<string, any>;
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  parseJson?: boolean;
  returnResponse?: boolean;
  body?: any;
};

function buildUrl(url: string, params?: Record<string, string | number | boolean>) {
  if (!params || Object.keys(params).length === 0) return url;
  const u = new URL(url, 'http://localhost'); // base only for relative handling
  Object.entries(params).forEach(([k, v]) => u.searchParams.append(k, String(v)));
  // if original url was absolute, preserve origin; otherwise return pathname+search
  if (/^https?:\/\//i.test(url)) return u.toString();
  return u.pathname + u.search;
}

export class ApiHelper {
  static async request(method: string, url: string, options?: RequestOptions) {
    const {
      headers = {},
      params,
      timeoutMs = 15000,
      retries = 0,
      retryDelayMs = 500,
      parseJson = true,
      returnResponse = false,
      body,
    } = options ?? {};

    const finalUrl = buildUrl(url, params);
    let attempt = 0;
    let lastError: unknown;
    const apiContext = await request.newContext({
      timeout: timeoutMs,
      extraHTTPHeaders: headers,
    });

    try {
      while (attempt <= retries) {
        attempt++;

        try {
          const reqHeaders: Record<string, string> = { ...headers };

          const applyBodyParams = (input: any, bodyParamMap?: Record<string, any>) => {
            if (!bodyParamMap) return input;
            try {
              if (typeof input === 'string') {
                let s = input;
                for (const [k, v] of Object.entries(bodyParamMap)) {
                  const re1 = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
                  const re2 = new RegExp(`:${k}`, 'g');
                  s = s.replace(re1, String(v)).replace(re2, String(v));
                }
                return s;
              }

              const json = JSON.stringify(input);
              let replaced = json;
              for (const [k, v] of Object.entries(bodyParamMap)) {
                const re1 = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
                const re2 = new RegExp(`:${k}`, 'g');
                replaced = replaced.replace(re1, String(v)).replace(re2, String(v));
              }
              return JSON.parse(replaced);
            } catch (e) {
              Logger.warn('API', `[ApiHelper] Failed to apply bodyParams: ${String(e)}`);
              return input;
            }
          };

          const finalBody = applyBodyParams(body, options?.bodyParams);
          let requestBody: any = undefined;
          if (finalBody !== undefined && finalBody !== null) {
            requestBody = finalBody;
            if (typeof finalBody !== 'string' && !(finalBody instanceof Uint8Array) && !(finalBody instanceof ArrayBuffer)) {
              reqHeaders['Content-Type'] = reqHeaders['Content-Type'] ?? 'application/json';
            }
          }

          Logger.info('API', `[${method}] ${finalUrl} (attempt ${attempt})`);
          if (params) Logger.debug('API', `Params: ${JSON.stringify(params)}`);
          if (finalBody) Logger.debug('API', `Body: ${typeof finalBody === 'string' ? finalBody : JSON.stringify(finalBody)}`);

          await AllureHelper.attachApiRequest({
            method,
            url: finalUrl,
            headers: reqHeaders,
            params,
            body: requestBody,
          });

          const response = await (apiContext as APIRequestContext)[method.toLowerCase() as 'get' | 'post' | 'put' | 'delete'](
            finalUrl,
            {
              headers: reqHeaders,
              params,
              data: requestBody,
              timeout: timeoutMs,
            } as any,
          );

          const contentType = response.headers()['content-type'] ?? '';
          const text = await response.text();

          let responseBody: any = text;
          if (parseJson && contentType.includes('application/json')) {
            try {
              responseBody = JSON.parse(text);
            } catch (err) {
              Logger.warn('API', `[API] Failed to parse JSON response from ${finalUrl}`);
            }
          }

          await AllureHelper.attachApiResponse({
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            body: responseBody,
          });

          if (!response.ok()) {
            const err = new Error(`[API] ${method} ${finalUrl} returned ${response.status()} ${response.statusText()} - ${text}`);
            Logger.error('API', err.message);
            throw err;
          }

          if (returnResponse) {
            return { statusCode: response.status(), body: responseBody };
          }

          return responseBody;
        } catch (err) {
          lastError = err;
          Logger.warn('API', `[${method}] Request attempt ${attempt} failed: ${String(err)}`);
          if (attempt > retries) break;
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
      }
    } finally {
      await apiContext.dispose();
    }

    throw lastError;
  }

  static get(url: string, options?: RequestOptions) {
    return this.request('GET', url, options);
  }

  static post(url: string, options?: RequestOptions) {
    return this.request('POST', url, options);
  }

  static put(url: string, options?: RequestOptions) {
    return this.request('PUT', url, options);
  }

  static delete(url: string, options?: RequestOptions) {
    return this.request('DELETE', url, options);
  }
}
 