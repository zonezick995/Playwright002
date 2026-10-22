"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryStore = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class QueryStore {
    static load(dbType) {
        if (!this.cache.has(dbType)) {
            // Load queries from JSON file based on dbType
            const filePath = path_1.default.resolve(__dirname, `../../db/${dbType}.json`);
            if (!fs_1.default.existsSync(filePath)) {
                throw new Error(`Query file not found for DB: ${dbType}`);
            }
            const queries = JSON.parse(fs_1.default.readFileSync(filePath, 'utf-8'));
            this.cache.set(dbType, queries);
        }
        return this.cache.get(dbType);
    }
    static get(dbType, key) {
        const queries = this.load(dbType);
        const sql = queries[key];
        if (!sql) {
            throw new Error(`Query "${key}" not found for DB "${dbType}"`);
        }
        return sql;
    }
}
exports.QueryStore = QueryStore;
QueryStore.cache = new Map();
