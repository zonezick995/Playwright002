"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiService = void 0;
const api_client_1 = require("../client/api-client");
class ApiService {
    static request(method, url, options) {
        return api_client_1.ApiClient.request(method, url, options);
    }
    static get(url, options) {
        return api_client_1.ApiClient.request('GET', url, options);
    }
    static post(url, options) {
        return api_client_1.ApiClient.request('POST', url, options);
    }
    static put(url, options) {
        return api_client_1.ApiClient.request('PUT', url, options);
    }
    static delete(url, options) {
        return api_client_1.ApiClient.request('DELETE', url, options);
    }
}
exports.ApiService = ApiService;
