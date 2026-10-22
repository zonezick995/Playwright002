import { ApiClient } from '../client/api-client';
import type { ApiMethod, ApiRequestOptions } from '../models/api-request.model';
import type { ApiResponse } from '../models/api-response.model';

export class ApiService {
  static request<T = unknown>(
    method: ApiMethod,
    url: string,
    options: ApiRequestOptions & { returnResponse: true },
  ): Promise<ApiResponse<T>>;
  static request<T = unknown>(
    method: ApiMethod,
    url: string,
    options?: ApiRequestOptions & { returnResponse?: false },
  ): Promise<T>;
  static request<T = unknown>(
    method: ApiMethod,
    url: string,
    options?: ApiRequestOptions,
  ): Promise<T | ApiResponse<T>> {
    return ApiClient.request<T>(method, url, options);
  }

  static get<T = unknown>(
    url: string,
    options: ApiRequestOptions & { returnResponse: true },
  ): Promise<ApiResponse<T>>;
  static get<T = unknown>(
    url: string,
    options?: ApiRequestOptions & { returnResponse?: false },
  ): Promise<T>;
  static get<T = unknown>(
    url: string,
    options?: ApiRequestOptions,
  ): Promise<T | ApiResponse<T>> {
    return ApiClient.request<T>('GET', url, options);
  }

  static post<T = unknown>(
    url: string,
    options: ApiRequestOptions & { returnResponse: true },
  ): Promise<ApiResponse<T>>;
  static post<T = unknown>(
    url: string,
    options?: ApiRequestOptions & { returnResponse?: false },
  ): Promise<T>;
  static post<T = unknown>(
    url: string,
    options?: ApiRequestOptions,
  ): Promise<T | ApiResponse<T>> {
    return ApiClient.request<T>('POST', url, options);
  }

  static put<T = unknown>(
    url: string,
    options: ApiRequestOptions & { returnResponse: true },
  ): Promise<ApiResponse<T>>;
  static put<T = unknown>(
    url: string,
    options?: ApiRequestOptions & { returnResponse?: false },
  ): Promise<T>;
  static put<T = unknown>(
    url: string,
    options?: ApiRequestOptions,
  ): Promise<T | ApiResponse<T>> {
    return ApiClient.request<T>('PUT', url, options);
  }

  static delete<T = unknown>(
    url: string,
    options: ApiRequestOptions & { returnResponse: true },
  ): Promise<ApiResponse<T>>;
  static delete<T = unknown>(
    url: string,
    options?: ApiRequestOptions & { returnResponse?: false },
  ): Promise<T>;
  static delete<T = unknown>(
    url: string,
    options?: ApiRequestOptions,
  ): Promise<T | ApiResponse<T>> {
    return ApiClient.request<T>('DELETE', url, options);
  }
}
