import * as vscode from 'vscode';

export class M68kLogger {
    private static readonly PREFIX = '[M68K-ASM]';
    private static outputChannel: vscode.OutputChannel | null = null;

    private static getOutputChannel(): vscode.OutputChannel {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('M68K Assembly');
        }
        return this.outputChannel;
    }

    private static formatMessage(message: string, ...args: any[]): string {
        const timestamp = new Date().toLocaleTimeString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ') : '';
        return `[${timestamp}] ${this.PREFIX} ${message}${formattedArgs}`;
    }

    static log(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(message, ...args));
    }    static warn(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`WARN: ${message}`, ...args));
    }

    static error(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`ERROR: ${message}`, ...args));
    }

    static info(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`INFO: ${message}`, ...args));
    }

    static debug(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`DEBUG: ${message}`, ...args));
    }    // Convenience methods for common logging patterns
    static logSuccess(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`SUCCESS: ${message}`, ...args));
    }

    static logFailure(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`FAILURE: ${message}`, ...args));
    }

    static logWarning(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`WARNING: ${message}`, ...args));
    }

    static logProgress(message: string, ...args: any[]): void {
        this.getOutputChannel().appendLine(this.formatMessage(`  ${message}`, ...args));
    }

    // Utility methods for output channel management
    static show(): void {
        this.getOutputChannel().show();
    }

    static clear(): void {
        this.getOutputChannel().clear();
    }

    static dispose(): void {
        if (this.outputChannel) {
            this.outputChannel.dispose();
            this.outputChannel = null;
        }
    }
}
