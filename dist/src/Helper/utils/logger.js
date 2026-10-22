"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs_1 = __importDefault(require("fs"));
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    static configure(options) {
        this.options = { ...this.options, ...options };
    }
    static debug(scope, message) {
        this.log(LogLevel.DEBUG, scope, message);
    }
    static info(scope, message) {
        this.log(LogLevel.INFO, scope, message);
    }
    static warn(scope, message) {
        this.log(LogLevel.WARN, scope, message);
    }
    static error(scope, message, error) {
        this.log(LogLevel.ERROR, scope, message, error);
    }
    static log(level, scope, message, error) {
        if (!this.options.enabled)
            return;
        if (!this.isLevelAllowed(level))
            return;
        const timestamp = new Date().toISOString();
        // ===== Console Table Format =====
        let levelStr;
        switch (level) {
            case LogLevel.DEBUG:
                levelStr = chalk_1.default.gray(level);
                break;
            case LogLevel.INFO:
                levelStr = chalk_1.default.blue(level);
                break;
            case LogLevel.WARN:
                levelStr = chalk_1.default.yellow(level);
                break;
            case LogLevel.ERROR:
                levelStr = chalk_1.default.red(level);
                break;
            default:
                levelStr = level;
        }
        // Table format: timestamp | scope | level | message
        console.log(`${chalk_1.default.green(timestamp.padEnd(25))} | ${chalk_1.default.cyan(scope.padEnd(5))} | ${levelStr.padEnd(5)} | ${message}`);
        if (error)
            console.error(error);
        // ===== JSON log for ELK/Grafana =====
        if (this.options.filePath) {
            const logObject = {
                timestamp,
                level,
                scope,
                message,
                error: error ? String(error) : undefined,
            };
            fs_1.default.appendFileSync(this.options.filePath, JSON.stringify(logObject) + '\n');
        }
    }
    static isLevelAllowed(level) {
        const order = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return order.indexOf(level) >= order.indexOf(this.options.minLevel);
    }
}
exports.Logger = Logger;
Logger.options = {
    enabled: true,
    minLevel: LogLevel.INFO,
    // filePath: 'logs/log.json',
};
