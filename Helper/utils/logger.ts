import chalk from 'chalk';
import fs from 'fs';

export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

type LogScope = 'UI' | 'API' | 'TEST' | 'HOOK' | 'UTIL'| 'DB';

interface LoggerOptions {
    enabled: boolean;       // bật/tắt log
    minLevel: LogLevel;     // log level tối thiểu
    filePath?: string;      // đường dẫn log file JSON
}

export class Logger {
    private static options: LoggerOptions = {
        enabled: true,
        minLevel: LogLevel.INFO,
        // filePath: 'logs/log.json',
    };

    static configure(options: Partial<LoggerOptions>) {
        this.options = { ...this.options, ...options };
    }

    static debug(scope: LogScope, message: string) {
        this.log(LogLevel.DEBUG, scope, message);
    }

    static info(scope: LogScope, message: string) {
        this.log(LogLevel.INFO, scope, message);
    }

    static warn(scope: LogScope, message: string) {
        this.log(LogLevel.WARN, scope, message);
    }

    static error(scope: LogScope, message: string, error?: unknown) {
        this.log(LogLevel.ERROR, scope, message, error);
    }

    private static log(
        level: LogLevel,
        scope: LogScope,
        message: string,
        error?: unknown
    ) {
        if (!this.options.enabled) return;
        if (!this.isLevelAllowed(level)) return;

        const timestamp = new Date().toISOString();

        // ===== Console Table Format =====
        let levelStr: string;
        switch (level) {
            case LogLevel.DEBUG:
                levelStr = chalk.gray(level);
                break;
            case LogLevel.INFO:
                levelStr = chalk.blue(level);
                break;
            case LogLevel.WARN:
                levelStr = chalk.yellow(level);
                break;
            case LogLevel.ERROR:
                levelStr = chalk.red(level);
                break;
            default:
                levelStr = level;
        }

        // Table format: timestamp | scope | level | message
        console.log(
            `${chalk.green(timestamp.padEnd(25))} | ${chalk.cyan(scope.padEnd(5))} | ${levelStr.padEnd(5)} | ${message}`
        );
        if (error) console.error(error);

        // ===== JSON log for ELK/Grafana =====
        if (this.options.filePath) {
            const logObject = {
                timestamp,
                level,
                scope,
                message,
                error: error ? String(error) : undefined,
            };
            fs.appendFileSync(this.options.filePath, JSON.stringify(logObject) + '\n');
        }
    }

    private static isLevelAllowed(level: LogLevel): boolean {
        const order = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
        return order.indexOf(level) >= order.indexOf(this.options.minLevel);
    }
}
 