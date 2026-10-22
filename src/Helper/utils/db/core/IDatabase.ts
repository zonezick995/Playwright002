/**
* TypeScript Idiomatic: Type alias thay vì interface
* Functional type definition thay vì OOP interface
*/

export type IDatabase = {
  query<T = any>(key: string, params?: any): Promise<T[]>;
  execute(key: string, params?: any): Promise<number>;
  close(): Promise<void>;
};

// Re-export từ DatabaseFactory để đồng nhất
export type { Database } from '../DatabaseFactory';
 