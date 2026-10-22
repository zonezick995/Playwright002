import fs from 'fs';
import path from 'path';

type DBType = 'mssql' | 'postgres' | 'oracle';

export class QueryStore {
  private static cache: Map<DBType, Record<string, string>> = new Map();

  static load(dbType: DBType) {
    if (!this.cache.has(dbType)) {
      // Load queries from JSON file based on dbType
      const filePath = path.resolve(
        __dirname,
        `../../db/${dbType}.json`
      );

      if (!fs.existsSync(filePath)) {
        throw new Error(`Query file not found for DB: ${dbType}`);
      }

      const queries = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.cache.set(dbType, queries);
    }

    return this.cache.get(dbType)!;
  }

  static get(dbType: DBType, key: string): string {
    const queries = this.load(dbType);
    const sql = queries[key];

    if (!sql) {
      throw new Error(`Query "${key}" not found for DB "${dbType}"`);
    }

    return sql;
  }
}
 