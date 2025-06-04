export class M68kLogger {
    private static readonly PREFIX = '[M68K-ASM]';

    static log(message: string, ...args: any[]): void {
        console.log(`${this.PREFIX} ${message}`, ...args);
    }

    static warn(message: string, ...args: any[]): void {
        console.warn(`${this.PREFIX} ${message}`, ...args);
    }

    static error(message: string, ...args: any[]): void {
        console.error(`${this.PREFIX} ${message}`, ...args);
    }

    static info(message: string, ...args: any[]): void {
        console.info(`${this.PREFIX} ${message}`, ...args);
    }

    static debug(message: string, ...args: any[]): void {
        console.debug(`${this.PREFIX} ${message}`, ...args);
    }

    // Convenience methods for common logging patterns
    static logSuccess(message: string, ...args: any[]): void {
        console.log(`${this.PREFIX} ✓ ${message}`, ...args);
    }

    static logFailure(message: string, ...args: any[]): void {
        console.warn(`${this.PREFIX} ✗ ${message}`, ...args);
    }

    static logWarning(message: string, ...args: any[]): void {
        console.warn(`${this.PREFIX} ⚠ ${message}`, ...args);
    }

    static logProgress(message: string, ...args: any[]): void {
        console.log(`${this.PREFIX}   ${message}`, ...args);
    }
}
