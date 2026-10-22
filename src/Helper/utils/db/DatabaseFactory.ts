import sql from 'mssql';
import { Pool as PgPool } from 'pg';
import oracledb from 'oracledb';
import { Logger } from '../logger';
import { QueryStore } from './core/QueryStore';

/**
* TypeScript Idiomatic: Functional approach với discriminated unions
* Thay vì class inheritance, dùng type discrimination + composition
*/

// Type-safe database types
export type DBDriver = 'mssql' | 'postgres' | 'oracle';
export type DBKey = 'CLMS' | 'DNAA';

// Database interface với generic support
export type Database = {
  query<T = any>(key: string, params?: any): Promise<T[]>;
  execute(key: string, params?: any): Promise<number>;
  close(): Promise<void>;
};

// MSSQL implementation (functional)
const createMSSQLDatabase = (config: sql.config): Database => {
  const pool = new sql.ConnectionPool(config);
  let connected = false;

  const getPool = async () => {
    if (!connected) {
      Logger.info('DB', '[mssql] Connecting...');
      await pool.connect();
      Logger.info('DB', '[mssql] ✓ Connected');
      connected = true;
    }
    return pool;
  };

  return {
    async query<T>(key: string, params?: Record<string, any>): Promise<T[]> {
      const sqlText = QueryStore.get('mssql', key);
      Logger.info('DB', `[mssql] ${key}`);

      const poolInstance = await getPool();
      const request = poolInstance.request();

      if (params) {
        Object.entries(params).forEach(([k, v]) => request.input(k, v));
      }

      const result = await request.query<T>(sqlText);
      return result.recordset;
    },

    async execute(key: string, params?: Record<string, any>): Promise<number> {
      const sqlText = QueryStore.get('mssql', key);
      Logger.info('DB', `[mssql] ${key}`);

      const poolInstance = await getPool();
      const request = poolInstance.request();

      if (params) {
        Object.entries(params).forEach(([k, v]) => request.input(k, v));
      }

      const result = await request.query(sqlText);
      return result.rowsAffected[0] ?? 0;
    },

    async close() {
      await pool.close();
      Logger.info('DB', '[mssql] ✓ Closed');
    },
  };
};

// Postgres implementation
const createPostgresDatabase = (config: any): Database => {
  const pool = new PgPool(config);

  return {
    async query<T>(key: string, params?: Record<string, any>): Promise<T[]> {
      const sqlText = QueryStore.get('postgres', key);
      Logger.info('DB', `[postgres] ${key}`);

      const values = params ? Object.values(params) : [];
      const result = await pool.query(sqlText, values);
      return result.rows as T[];
    },

    async execute(key: string, params?: Record<string, any>): Promise<number> {
      const sqlText = QueryStore.get('postgres', key);
      Logger.info('DB', `[postgres] ${key}`);

      const values = params ? Object.values(params) : [];
      const result = await pool.query(sqlText, values);
      return result.rowCount ?? 0;
    },

    async close() {
      await pool.end();
      Logger.info('DB', '[postgres] ✓ Closed');
    },
  };
};

// Oracle implementation
const createOracleDatabase = (config: oracledb.PoolAttributes): Database => {
  let pool: oracledb.Pool | null = null;

  const getPool = async () => {
    if (!pool) {
      Logger.info('DB', '[oracle] Connecting...');
      pool = await oracledb.createPool(config);
      Logger.info('DB', '[oracle] ✓ Connected');
    }
    return pool;
  };

  return {
    async query<T>(key: string, params?: Record<string, any>): Promise<T[]> {
      const sqlText = QueryStore.get('oracle', key);
      Logger.info('DB', `[oracle] ${key}`);

      const poolInstance = await getPool();
      const conn = await poolInstance.getConnection();

      try {
        const result = await conn.execute(sqlText, params || {}, {
          outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        return (result.rows ?? []) as T[];
      } finally {
        await conn.close();
      }
    },

    async execute(key: string, params?: Record<string, any>): Promise<number> {
      const sqlText = QueryStore.get('oracle', key);
      Logger.info('DB', `[oracle] ${key}`);

      const poolInstance = await getPool();
      const conn = await poolInstance.getConnection();

      try {
        const result = await conn.execute(sqlText, params || {}, {
          autoCommit: true,
        });
        return result.rowsAffected ?? 0;
      } finally {
        await conn.close();
      }
    },

    async close() {
      if (pool) {
        await pool.close(10);
        Logger.info('DB', '[oracle] ✓ Closed');
      }
    },
  };
};

// Factory function với type discrimination
const dbFactories = {
  mssql: (key: DBKey) => createMSSQLDatabase({
    user: process.env[`DB_${key}_USER`]!,
    password: process.env[`DB_${key}_PASSWORD`]!,
    server: process.env[`DB_${key}_HOST`]!,
    database: process.env[`DB_${key}_NAME`]!,
    options: { trustServerCertificate: true },
  }),

  postgres: (key: DBKey) => createPostgresDatabase({
    host: process.env[`DB_${key}_HOST`],
    user: process.env[`DB_${key}_USER`],
    password: process.env[`DB_${key}_PASSWORD`],
    database: process.env[`DB_${key}_NAME`],
  }),

  oracle: (key: DBKey) => createOracleDatabase({
    user: process.env[`DB_${key}_USER`],
    password: process.env[`DB_${key}_PASSWORD`],
    connectString: process.env[`DB_${key}_HOST`],
  }),
} as const;

// Singleton cache (WeakMap would be better but Map works here)
const instances = new Map<DBKey, Database>();

// Main factory function - clean & type-safe
export const getDatabase = (dbType: DBDriver, key: DBKey): Database => {
  // Check cache first
  if (instances.has(key)) {
    return instances.get(key)!;
  }

  //  Create new instance
  const factory = dbFactories[dbType];
  if (!factory) {
    throw new Error(`Unsupported database type: ${dbType}`);
  }

  // Create, cache, and return instance
  const db = factory(key);

  instances.set(key, db);
  return db;
};
 