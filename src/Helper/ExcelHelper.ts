import * as XLSX from 'xlsx';
import * as path from 'path';
import { Logger } from './utils/logger';

export class ExcelHelper {
    /**
     * Đọc dữ liệu từ file Excel, trả về mảng object cho sheet chỉ định.
     * @param filePath Đường dẫn tuyệt đối hoặc tương đối tới file Excel
     * @param sheetName Tên sheet cần đọc
     */
    static readSheet(filePath: string, sheetName: string, options?: { throwOnError?: boolean, onError?: (err: Error) => void }): any[] {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            if (!absPath || !sheetName) throw new Error('Missing filePath or sheetName');
            const workbook = XLSX.readFile(absPath);
            const sheet = workbook.Sheets[sheetName];
            if (!sheet) throw new Error(`Sheet "${sheetName}" not found in ${absPath}`);
            const data = XLSX.utils.sheet_to_json(sheet);
            Logger.info('UTIL', `[ExcelHelper] Read ${data.length} rows from ${sheetName} in ${absPath}`);
            return data;
        } catch (err) {
            Logger.error('UTIL', `[ExcelHelper] Error reading Excel: ${String(err)}`);
            if (options?.onError) options.onError(err as Error);
            if (options?.throwOnError) throw err;
            return [];
        }
    }

    /**
     * Đọc toàn bộ các sheet trong file Excel, trả về object { sheetName: data[] }
     */
    static readAllSheets(filePath: string, options?: { throwOnError?: boolean, onError?: (err: Error) => void }): Record<string, any[]> {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            const workbook = XLSX.readFile(absPath);
            const result: Record<string, any[]> = {};
            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                result[sheetName] = XLSX.utils.sheet_to_json(sheet);
            }
            Logger.info('UTIL', `[ExcelHelper] Read all sheets from ${absPath}`);
            return result;
        } catch (err) {
            Logger.error('UTIL', `[ExcelHelper] Error reading all sheets: ${String(err)}`);
            if (options?.onError) options.onError(err as Error);
            if (options?.throwOnError) throw err;
            return {};
        }
    }
}