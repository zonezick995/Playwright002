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
exports.ExcelHelper = void 0;
const XLSX = __importStar(require("xlsx"));
const path = __importStar(require("path"));
const logger_1 = require("./utils/logger");
class ExcelHelper {
    /**
     * Đọc dữ liệu từ file Excel, trả về mảng object cho sheet chỉ định.
     * @param filePath Đường dẫn tuyệt đối hoặc tương đối tới file Excel
     * @param sheetName Tên sheet cần đọc
     */
    static readSheet(filePath, sheetName, options) {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            if (!absPath || !sheetName)
                throw new Error('Missing filePath or sheetName');
            const workbook = XLSX.readFile(absPath);
            const sheet = workbook.Sheets[sheetName];
            if (!sheet)
                throw new Error(`Sheet "${sheetName}" not found in ${absPath}`);
            const data = XLSX.utils.sheet_to_json(sheet);
            logger_1.Logger.info('UTIL', `[ExcelHelper] Read ${data.length} rows from ${sheetName} in ${absPath}`);
            return data;
        }
        catch (err) {
            logger_1.Logger.error('UTIL', `[ExcelHelper] Error reading Excel: ${String(err)}`);
            if (options?.onError)
                options.onError(err);
            if (options?.throwOnError)
                throw err;
            return [];
        }
    }
    /**
     * Đọc toàn bộ các sheet trong file Excel, trả về object { sheetName: data[] }
     */
    static readAllSheets(filePath, options) {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            const workbook = XLSX.readFile(absPath);
            const result = {};
            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                result[sheetName] = XLSX.utils.sheet_to_json(sheet);
            }
            logger_1.Logger.info('UTIL', `[ExcelHelper] Read all sheets from ${absPath}`);
            return result;
        }
        catch (err) {
            logger_1.Logger.error('UTIL', `[ExcelHelper] Error reading all sheets: ${String(err)}`);
            if (options?.onError)
                options.onError(err);
            if (options?.throwOnError)
                throw err;
            return {};
        }
    }
}
exports.ExcelHelper = ExcelHelper;
