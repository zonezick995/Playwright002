import { Logger } from './utils/logger';

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
      body,
    } = options ?? {};

    const finalUrl = buildUrl(url, params);

    let attempt = 0;
    let lastError: unknown;

    while (attempt <= retries) {
      attempt++;
      let controller: AbortController | undefined;
      try {
        if (typeof fetch === 'undefined') {
          throw new Error('Global fetch is not available. Run on Node 18+ or polyfill fetch (node-fetch).');
        }

        controller = new AbortController();
        const signal = controller.signal;
        const timeout = setTimeout(() => controller?.abort(), timeoutMs);

        const reqHeaders: Record<string, string> = { ...headers };
        // apply body params if provided (supports object or string templates)
        let bodyPayload: any = undefined;
        const applyBodyParams = (input: any, params?: Record<string, any>) => {
          if (!params) return input;
          try {
            if (typeof input === 'string') {
              let s = input;
              for (const [k, v] of Object.entries(params)) {
                const re1 = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
                const re2 = new RegExp(`:${k}`, 'g');
                s = s.replace(re1, String(v)).replace(re2, String(v));
              }
              return s;
            }

            // object: stringify and replace then parse back
            const json = JSON.stringify(input);
            let replaced = json;
            for (const [k, v] of Object.entries(params)) {
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
        if (finalBody !== undefined && finalBody !== null) {
          if (typeof finalBody === 'string' || finalBody instanceof Uint8Array || finalBody instanceof ArrayBuffer) {
            bodyPayload = finalBody as any;
          } else {
            // assume JSON
            bodyPayload = JSON.stringify(finalBody);
            reqHeaders['Content-Type'] = reqHeaders['Content-Type'] ?? 'application/json';
          }
        }

        Logger.info('API', `[${method}] ${finalUrl} (attempt ${attempt})`);
        if (params) Logger.debug('API', `Params: ${JSON.stringify(params)}`);
        if (body) Logger.debug('API', `Body: ${typeof body === 'string' ? body : JSON.stringify(body)}`);

        const resp = await fetch(finalUrl, {
          method,
          headers: reqHeaders,
          body: bodyPayload,
          signal,
        } as any);

        clearTimeout(timeout);

        const contentType = resp.headers.get('content-type') ?? '';
        const text = await resp.text();

        if (!resp.ok) {
          const err = new Error(`[API] ${method} ${finalUrl} returned ${resp.status} ${resp.statusText} - ${text}`);
          Logger.error('API', err.message);
          throw err;
        }

        if (parseJson && contentType.includes('application/json')) {
          try {
            return JSON.parse(text);
          } catch (err) {
            Logger.warn('API', `[API] Failed to parse JSON response from ${finalUrl}`);
            return text;
          }
        }

        return text;
      } catch (err) {
        lastError = err;
        Logger.warn('API', `[${method}] Request attempt ${attempt} failed: ${String(err)}`);
        if (attempt > retries) break;
        await new Promise((r) => setTimeout(r, retryDelayMs));
        continue;
      }
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
 