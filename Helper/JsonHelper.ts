// utils/jsonHelper.ts
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './logger';

export class JsonHelper {
    /**
     * Đọc file JSON, trả về object. Nếu lỗi trả về undefined.
     * @param filePath Đường dẫn tuyệt đối hoặc tương đối tới file JSON
     */
    static read(filePath: string): any {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            if (!fs.existsSync(absPath)) throw new Error(`File not found: ${absPath}`);
            const raw = fs.readFileSync(absPath, 'utf-8');
            const data = JSON.parse(raw);
            Logger.info('UTIL', `[JsonHelper] Read JSON from ${absPath}`);
            return data;
        } catch (err) {
            Logger.error('UTIL', `[JsonHelper] Error reading JSON: ${String(err)}`);
            return undefined;
        }
    }

    /**
     * Ghi object vào file JSON
     * @param filePath Đường dẫn file
     * @param data Dữ liệu object
     */
    static write(filePath: string, data: any): boolean {
        try {
            const absPath = path.isAbsolute(filePath)
                ? filePath
                : path.resolve(process.cwd(), filePath);
            fs.writeFileSync(absPath, JSON.stringify(data, null, 2), 'utf-8');
            Logger.info('UTIL', `[JsonHelper] Wrote JSON to ${absPath}`);
            return true;
        } catch (err) {
            Logger.error('UTIL', `[JsonHelper] Error writing JSON: ${String(err)}`);
            return false;
        }
    }

    /**
     * Lấy giá trị theo key từ file JSON
     * @param filePath Đường dẫn file
     * @param key Key cần lấy
     */
    static get(filePath: string, key: string): any {
        const data = this.read(filePath);
        return data ? data[key] : undefined;
    }
}

 