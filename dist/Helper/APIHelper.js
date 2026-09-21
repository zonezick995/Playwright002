"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiHelper = void 0;
const test_1 = require("@playwright/test");
const logger_1 = require("./utils/logger");
function buildUrl(url, params) {
    if (!params || Object.keys(params).length === 0)
        return url;
    const u = new URL(url, 'http://localhost'); // base only for relative handling
    Object.entries(params).forEach(([k, v]) => u.searchParams.append(k, String(v)));
    // if original url was absolute, preserve origin; otherwise return pathname+search
    if (/^https?:\/\//i.test(url))
        return u.toString();
    return u.pathname + u.search;
}
class ApiHelper {
    static async request(method, url, options) {
        const { headers = {}, params, timeoutMs = 15000, retries = 0, retryDelayMs = 500, parseJson = true, returnResponse = false, body, } = options ?? {};
        const finalUrl = buildUrl(url, params);
        let attempt = 0;
        let lastError;
        const apiContext = await test_1.request.newContext({
            timeout: timeoutMs,
            extraHTTPHeaders: headers,
        });
        try {
            while (attempt <= retries) {
                attempt++;
                try {
                    const reqHeaders = { ...headers };
                    const applyBodyParams = (input, bodyParamMap) => {
                        if (!bodyParamMap)
                            return input;
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
                        }
                        catch (e) {
                            logger_1.Logger.warn('API', `[ApiHelper] Failed to apply bodyParams: ${String(e)}`);
                            return input;
                        }
                    };
                    const finalBody = applyBodyParams(body, options?.bodyParams);
                    let requestBody = undefined;
                    if (finalBody !== undefined && finalBody !== null) {
                        requestBody = finalBody;
                        if (typeof finalBody !== 'string' && !(finalBody instanceof Uint8Array) && !(finalBody instanceof ArrayBuffer)) {
                            reqHeaders['Content-Type'] = reqHeaders['Content-Type'] ?? 'application/json';
                        }
                    }
                    logger_1.Logger.info('API', `[${method}] ${finalUrl} (attempt ${attempt})`);
                    if (params)
                        logger_1.Logger.debug('API', `Params: ${JSON.stringify(params)}`);
                    if (finalBody)
                        logger_1.Logger.debug('API', `Body: ${typeof finalBody === 'string' ? finalBody : JSON.stringify(finalBody)}`);
                    const response = await apiContext[method.toLowerCase()](finalUrl, {
                        headers: reqHeaders,
                        params,
                        data: requestBody,
                        timeout: timeoutMs,
                    });
                    const contentType = response.headers()['content-type'] ?? '';
                    const text = await response.text();
                    if (!response.ok()) {
                        const err = new Error(`[API] ${method} ${finalUrl} returned ${response.status()} ${response.statusText()} - ${text}`);
                        logger_1.Logger.error('API', err.message);
                        throw err;
                    }
                    let responseBody = text;
                    if (parseJson && contentType.includes('application/json')) {
                        try {
                            responseBody = JSON.parse(text);
                        }
                        catch (err) {
                            logger_1.Logger.warn('API', `[API] Failed to parse JSON response from ${finalUrl}`);
                        }
                    }
                    if (returnResponse) {
                        return { statusCode: response.status(), body: responseBody };
                    }
                    return responseBody;
                }
                catch (err) {
                    lastError = err;
                    logger_1.Logger.warn('API', `[${method}] Request attempt ${attempt} failed: ${String(err)}`);
                    if (attempt > retries)
                        break;
                    await new Promise((r) => setTimeout(r, retryDelayMs));
                    continue;
                }
            }
        }
        finally {
            await apiContext.dispose();
        }
        throw lastError;
    }
    static get(url, options) {
        return this.request('GET', url, options);
    }
    static post(url, options) {
        return this.request('POST', url, options);
    }
    static put(url, options) {
        return this.request('PUT', url, options);
    }
    static delete(url, options) {
        return this.request('DELETE', url, options);
    }
}
exports.ApiHelper = ApiHelper;
