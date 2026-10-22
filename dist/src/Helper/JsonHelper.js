"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonHelper = void 0;
// utils/jsonHelper.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const logger_1 = require("./utils/logger");
class JsonHelper {
    /**
     * Đọc file JSON, trả về object. Nếu lỗi trả về undefined.
     * @param filePath Đường dẫn tuyệt đối hoặc tương đối tới file JSON
     */
    static read(filePath) {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            if (!fs.existsSync(absPath))
                throw new Error(`File not found: ${absPath}`);
            const raw = fs.readFileSync(absPath, 'utf-8');
            const data = JSON.parse(raw);
            logger_1.Logger.info('UTIL', `[JsonHelper] Read JSON from ${absPath}`);
            return data;
        }
        catch (err) {
            logger_1.Logger.error('UTIL', `[JsonHelper] Error reading JSON: ${String(err)}`);
            return undefined;
        }
    }
    /**
     * Ghi object vào file JSON
     * @param filePath Đường dẫn file
     * @param data Dữ liệu object
     */
    static write(filePath, data) {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            fs.writeFileSync(absPath, JSON.stringify(data, null, 2), 'utf-8');
            logger_1.Logger.info('UTIL', `[JsonHelper] Wrote JSON to ${absPath}`);
            return true;
        }
        catch (err) {
            logger_1.Logger.error('UTIL', `[JsonHelper] Error writing JSON: ${String(err)}`);
            return false;
        }
    }
    /**
     * Lấy giá trị theo key từ file JSON
     * @param filePath Đường dẫn file
     * @param key Key cần lấy
     */
    static get(filePath, key) {
        const data = this.read(filePath);
        return data ? data[key] : undefined;
    }
}
exports.JsonHelper = JsonHelper;
