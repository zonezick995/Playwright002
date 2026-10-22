"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const test_1 = require("@playwright/test");
const AllureHelper_1 = require("../../Helper/AllureHelper");
const logger_1 = require("../../Helper/utils/logger");
const buildUrl = (url, params) => {
    if (!params || Object.keys(params).length === 0)
        return url;
    const parsedUrl = new URL(url, 'http://localhost');
    Object.entries(params).forEach(([key, value]) => {
        parsedUrl.searchParams.append(key, String(value));
    });
    return /^https?:\/\//i.test(url)
        ? parsedUrl.toString()
        : parsedUrl.pathname + parsedUrl.search;
};
const applyBodyParams = (input, bodyParamMap) => {
    if (!bodyParamMap)
        return input;
    try {
        const replaceParams = (value) => {
            let result = value;
            for (const [key, replacement] of Object.entries(bodyParamMap)) {
                result = result
                    .replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(replacement))
                    .replace(new RegExp(`:${key}`, 'g'), String(replacement));
            }
            return result;
        };
        if (typeof input === 'string')
            return replaceParams(input);
        return JSON.parse(replaceParams(JSON.stringify(input)));
    }
    catch (error) {
        logger_1.Logger.warn('API', `[ApiClient] Failed to apply bodyParams: ${String(error)}`);
        return input;
    }
};
class ApiClient {
    static async request(method, url, options) {
        const { headers = {}, params, timeoutMs = 15000, retries = 0, retryDelayMs = 500, parseJson = true, returnResponse = false, body, bodyParams, } = options ?? {};
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
                    const requestHeaders = { ...headers };
                    const finalBody = applyBodyParams(body, bodyParams);
                    const requestBody = finalBody === undefined || finalBody === null ? undefined : finalBody;
                    if (requestBody !== undefined &&
                        typeof requestBody !== 'string' &&
                        !(requestBody instanceof Uint8Array) &&
                        !(requestBody instanceof ArrayBuffer)) {
                        requestHeaders['Content-Type'] = requestHeaders['Content-Type'] ?? 'application/json';
                    }
                    logger_1.Logger.info('API', `[${method}] ${finalUrl} (attempt ${attempt})`);
                    if (params)
                        logger_1.Logger.debug('API', `Params: ${JSON.stringify(params)}`);
                    if (finalBody) {
                        logger_1.Logger.debug('API', `Body: ${typeof finalBody === 'string' ? finalBody : JSON.stringify(finalBody)}`);
                    }
                    await AllureHelper_1.AllureHelper.attachApiRequest({
                        method,
                        url: finalUrl,
                        headers: requestHeaders,
                        params,
                        body: requestBody,
                    });
                    const response = await apiContext.fetch(finalUrl, {
                        method,
                        headers: requestHeaders,
                        data: requestBody,
                        timeout: timeoutMs,
                    });
                    const contentType = response.headers()['content-type'] ?? '';
                    const text = await response.text();
                    let responseBody = text;
                    if (parseJson && contentType.includes('application/json')) {
                        try {
                            responseBody = JSON.parse(text);
                        }
                        catch {
                            logger_1.Logger.warn('API', `[API] Failed to parse JSON response from ${finalUrl}`);
                        }
                    }
                    await AllureHelper_1.AllureHelper.attachApiResponse({
                        status: response.status(),
                        statusText: response.statusText(),
                        headers: response.headers(),
                        body: responseBody,
                    });
                    if (!response.ok()) {
                        const error = new Error(`[API] ${method} ${finalUrl} returned ${response.status()} ${response.statusText()} - ${text}`);
                        logger_1.Logger.error('API', error.message);
                        throw error;
                    }
                    if (returnResponse) {
                        return { statusCode: response.status(), body: responseBody };
                    }
                    return responseBody;
                }
                catch (error) {
                    lastError = error;
                    logger_1.Logger.warn('API', `[${method}] Request attempt ${attempt} failed: ${String(error)}`);
                    if (attempt > retries)
                        break;
                    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
                }
            }
        }
        finally {
            await apiContext.dispose();
        }
        throw lastError;
    }
}
exports.ApiClient = ApiClient;
