export type ApiResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

export type ApiFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

export type ApiAssertOptions = {
  statusCode: number;
  fieldTypes?: Record<string, ApiFieldType>;
  fieldValues?: Record<string, unknown>;
};
