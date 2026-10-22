"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabase = void 0;
const mssql_1 = __importDefault(require("mssql"));
const pg_1 = require("pg");
const oracledb_1 = __importDefault(require("oracledb"));
const logger_1 = require("../logger");
const QueryStore_1 = require("./core/QueryStore");
// MSSQL implementation (functional)
const createMSSQLDatabase = (config) => {
    const pool = new mssql_1.default.ConnectionPool(config);
    let connected = false;
    const getPool = async () => {
        if (!connected) {
            logger_1.Logger.info('DB', '[mssql] Connecting...');
            await pool.connect();
            logger_1.Logger.info('DB', '[mssql] ✓ Connected');
            connected = true;
        }
        return pool;
    };
    return {
        async query(key, params) {
            const sqlText = QueryStore_1.QueryStore.get('mssql', key);
            logger_1.Logger.info('DB', `[mssql] ${key}`);
            const poolInstance = await getPool();
            const request = poolInstance.request();
            if (params) {
                Object.entries(params).forEach(([k, v]) => request.input(k, v));
            }
            const result = await request.query(sqlText);
            return result.recordset;
        },
        async execute(key, params) {
            const sqlText = QueryStore_1.QueryStore.get('mssql', key);
            logger_1.Logger.info('DB', `[mssql] ${key}`);
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
            logger_1.Logger.info('DB', '[mssql] ✓ Closed');
        },
    };
};
// Postgres implementation
const createPostgresDatabase = (config) => {
    const pool = new pg_1.Pool(config);
    return {
        async query(key, params) {
            const sqlText = QueryStore_1.QueryStore.get('postgres', key);
            logger_1.Logger.info('DB', `[postgres] ${key}`);
            const values = params ? Object.values(params) : [];
            const result = await pool.query(sqlText, values);
            return result.rows;
        },
        async execute(key, params) {
            const sqlText = QueryStore_1.QueryStore.get('postgres', key);
            logger_1.Logger.info('DB', `[postgres] ${key}`);
            const values = params ? Object.values(params) : [];
            const result = await pool.query(sqlText, values);
            return result.rowCount ?? 0;
        },
        async close() {
            await pool.end();
            logger_1.Logger.info('DB', '[postgres] ✓ Closed');
        },
    };
};
// Oracle implementation
const createOracleDatabase = (config) => {
    let pool = null;
    const getPool = async () => {
        if (!pool) {
            logger_1.Logger.info('DB', '[oracle] Connecting...');
            pool = await oracledb_1.default.createPool(config);
            logger_1.Logger.info('DB', '[oracle] ✓ Connected');
        }
        return pool;
    };
    return {
        async query(key, params) {
            const sqlText = QueryStore_1.QueryStore.get('oracle', key);
            logger_1.Logger.info('DB', `[oracle] ${key}`);
            const poolInstance = await getPool();
            const conn = await poolInstance.getConnection();
            try {
                const result = await conn.execute(sqlText, params || {}, {
                    outFormat: oracledb_1.default.OUT_FORMAT_OBJECT,
                });
                return (result.rows ?? []);
            }
            finally {
                await conn.close();
            }
        },
        async execute(key, params) {
            const sqlText = QueryStore_1.QueryStore.get('oracle', key);
            logger_1.Logger.info('DB', `[oracle] ${key}`);
            const poolInstance = await getPool();
            const conn = await poolInstance.getConnection();
            try {
                const result = await conn.execute(sqlText, params || {}, {
                    autoCommit: true,
                });
                return result.rowsAffected ?? 0;
            }
            finally {
                await conn.close();
            }
        },
        async close() {
            if (pool) {
                await pool.close(10);
                logger_1.Logger.info('DB', '[oracle] ✓ Closed');
            }
        },
    };
};
// Factory function với type discrimination
const dbFactories = {
    mssql: (key) => createMSSQLDatabase({
        user: process.env[`DB_${key}_USER`],
        password: process.env[`DB_${key}_PASSWORD`],
        server: process.env[`DB_${key}_HOST`],
        database: process.env[`DB_${key}_NAME`],
        options: { trustServerCertificate: true },
    }),
    postgres: (key) => createPostgresDatabase({
        host: process.env[`DB_${key}_HOST`],
        user: process.env[`DB_${key}_USER`],
        password: process.env[`DB_${key}_PASSWORD`],
        database: process.env[`DB_${key}_NAME`],
    }),
    oracle: (key) => createOracleDatabase({
        user: process.env[`DB_${key}_USER`],
        password: process.env[`DB_${key}_PASSWORD`],
        connectString: process.env[`DB_${key}_HOST`],
    }),
};
// Singleton cache (WeakMap would be better but Map works here)
const instances = new Map();
// Main factory function - clean & type-safe
const getDatabase = (dbType, key) => {
    // Check cache first
    if (instances.has(key)) {
        return instances.get(key);
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
exports.getDatabase = getDatabase;
