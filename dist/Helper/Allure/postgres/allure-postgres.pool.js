"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAllurePostgresPool = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const pg_1 = require("pg");
dotenv_1.default.config({ path: node_path_1.default.resolve(process.cwd(), ".env.postgres.local") });
const createAllurePostgresPool = () => {
    const connectionString = process.env.DATABASE_URL?.trim();
    if (connectionString) {
        return new pg_1.Pool({
            connectionString,
            connectionTimeoutMillis: 5000,
        });
    }
    const requiredSettings = ["PGDATABASE", "PGUSER", "PGPASSWORD"];
    const missingSettings = requiredSettings.filter((setting) => !process.env[setting]?.trim());
    if (missingSettings.length > 0) {
        throw new Error(`PostgreSQL config is missing ${missingSettings.join(", ")}. ` +
            "Set DATABASE_URL or PGDATABASE, PGUSER, and PGPASSWORD in .env.postgres.local.");
    }
    const port = Number(process.env.PGPORT ?? "5432");
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PGPORT must be an integer between 1 and 65535.");
    }
    return new pg_1.Pool({
        host: process.env.PGHOST?.trim() || "127.0.0.1",
        port,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        connectionTimeoutMillis: 5000,
    });
};
exports.createAllurePostgresPool = createAllurePostgresPool;
