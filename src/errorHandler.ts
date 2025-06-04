/**
 * Standardized error handling utilities for M68K Assembly Language Extension
 * 
 * This module provides consistent error handling patterns across all providers
 * and utilities in the extension.
 */

import * as vscode from 'vscode';
import { M68kLogger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

/**
 * Error context information
 */
export interface ErrorContext {
    operation: string;
    file?: string;
    line?: number;
    character?: number;
    symbolName?: string;
    additionalInfo?: Record<string, any>;
}

/**
 * Standardized error class for the M68K extension
 */
export class M68kError extends Error {
    public readonly severity: ErrorSeverity;
    public readonly context: ErrorContext;
    public readonly timestamp: Date;

    constructor(
        message: string,
        severity: ErrorSeverity = ErrorSeverity.ERROR,
        context: ErrorContext,
        originalError?: Error
    ) {
        super(message);
        this.name = 'M68kError';
        this.severity = severity;
        this.context = context;
        this.timestamp = new Date();

        // Preserve stack trace from original error if provided
        if (originalError && originalError.stack) {
            this.stack = originalError.stack;
        }
    }
}

/**
 * Standardized error handler utility class
 */
export class M68kErrorHandler {
    /**
     * Handles errors consistently across the extension
     */
    static handle(error: Error | M68kError | unknown, context: ErrorContext): void {
        const m68kError = this.normalizeError(error, context);
        
        // Log the error with appropriate level
        this.logError(m68kError);
        
        // Show user notification for critical errors
        if (m68kError.severity === ErrorSeverity.CRITICAL) {
            this.showErrorNotification(m68kError);
        }
    }

    /**
     * Wraps async operations with standardized error handling
     */
    static async withErrorHandling<T>(
        operation: () => Promise<T>,
        context: ErrorContext,
        defaultValue: T | null = null
    ): Promise<T | null> {
        try {
            return await operation();
        } catch (error) {
            this.handle(error, context);
            return defaultValue;
        }
    }

    /**
     * Wraps sync operations with standardized error handling
     */
    static withSyncErrorHandling<T>(
        operation: () => T,
        context: ErrorContext,
        defaultValue: T | null = null
    ): T | null {
        try {
            return operation();
        } catch (error) {
            this.handle(error, context);
            return defaultValue;
        }
    }

    /**
     * Creates a validation error for invalid inputs
     */
    static createValidationError(
        message: string,
        context: ErrorContext,
        severity: ErrorSeverity = ErrorSeverity.WARNING
    ): M68kError {
        return new M68kError(message, severity, {
            ...context,
            operation: `${context.operation} - Validation`
        });
    }

    /**
     * Creates a file operation error
     */
    static createFileError(
        message: string,
        filePath: string,
        context: ErrorContext,
        originalError?: Error
    ): M68kError {
        return new M68kError(message, ErrorSeverity.ERROR, {
            ...context,
            file: filePath,
            operation: `${context.operation} - File Operation`
        }, originalError);
    }

    /**
     * Creates a symbol resolution error
     */
    static createSymbolError(
        message: string,
        symbolName: string,
        context: ErrorContext,
        severity: ErrorSeverity = ErrorSeverity.WARNING
    ): M68kError {
        return new M68kError(message, severity, {
            ...context,
            symbolName,
            operation: `${context.operation} - Symbol Resolution`
        });
    }

    /**
     * Creates a parser error
     */
    static createParserError(
        message: string,
        filePath: string,
        line: number,
        context: ErrorContext,
        originalError?: Error
    ): M68kError {
        return new M68kError(message, ErrorSeverity.ERROR, {
            ...context,
            file: filePath,
            line,
            operation: `${context.operation} - Parser`
        }, originalError);
    }

    /**
     * Normalizes different error types to M68kError
     */
    private static normalizeError(error: unknown, context: ErrorContext): M68kError {
        if (error instanceof M68kError) {
            return error;
        }

        if (error instanceof Error) {
            return new M68kError(
                error.message,
                ErrorSeverity.ERROR,
                context,
                error
            );
        }

        // Handle string errors or unknown error types
        const message = typeof error === 'string' ? error : 'Unknown error occurred';
        return new M68kError(message, ErrorSeverity.ERROR, context);
    }

    /**
     * Logs error with appropriate formatting
     */
    private static logError(error: M68kError): void {
        const contextInfo = this.formatContextInfo(error.context);
        const fullMessage = `${error.message}${contextInfo}`;

        switch (error.severity) {
            case ErrorSeverity.INFO:
                M68kLogger.info(fullMessage);
                break;
            case ErrorSeverity.WARNING:
                M68kLogger.warn(fullMessage);
                break;
            case ErrorSeverity.ERROR:
                M68kLogger.error(fullMessage);
                break;
            case ErrorSeverity.CRITICAL:
                M68kLogger.error(`CRITICAL: ${fullMessage}`);
                break;
        }

        // Log stack trace for errors and critical issues
        if (error.stack && (error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL)) {
            M68kLogger.debug(`Stack trace: ${error.stack}`);
        }
    }

    /**
     * Formats context information for logging
     */
    private static formatContextInfo(context: ErrorContext): string {
        const parts: string[] = [];

        if (context.file) {
            parts.push(`file: ${context.file}`);
        }

        if (context.line !== undefined) {
            parts.push(`line: ${context.line + 1}`); // Convert to 1-based line numbers
        }

        if (context.character !== undefined) {
            parts.push(`character: ${context.character}`);
        }

        if (context.symbolName) {
            parts.push(`symbol: ${context.symbolName}`);
        }

        if (context.operation) {
            parts.push(`operation: ${context.operation}`);
        }

        if (context.additionalInfo) {
            const additional = Object.entries(context.additionalInfo)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            if (additional) {
                parts.push(additional);
            }
        }

        return parts.length > 0 ? ` [${parts.join(', ')}]` : '';
    }

    /**
     * Shows error notification to user for critical errors
     */
    private static showErrorNotification(error: M68kError): void {
        const action = 'Show Output';
        vscode.window.showErrorMessage(
            `M68K Assembly: ${error.message}`,
            action
        ).then(selectedAction => {
            if (selectedAction === action) {
                M68kLogger.show();
            }
        });
    }
}

/**
 * Decorator for automatic error handling in class methods
 */
export function handleErrors(context: Partial<ErrorContext> = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const errorContext: ErrorContext = {
                operation: `${target.constructor.name}.${propertyKey}`,
                ...context
            };

            try {
                const result = originalMethod.apply(this, args);
                
                // Handle async methods
                if (result instanceof Promise) {
                    return result.catch((error: unknown) => {
                        M68kErrorHandler.handle(error, errorContext);
                        return null;
                    });
                }
                
                return result;
            } catch (error) {
                M68kErrorHandler.handle(error, errorContext);
                return null;
            }
        };

        return descriptor;
    };
}

/**
 * Utility functions for common error scenarios
 */
export class M68kErrorUtils {
    /**
     * Validates that a file exists and is readable
     */
    static validateFileAccess(filePath: string, operation: string): void {
        const fs = require('fs');
        
        try {
            if (!fs.existsSync(filePath)) {
                throw M68kErrorHandler.createFileError(
                    `File not found: ${filePath}`,
                    filePath,
                    { operation }
                );
            }

            // Test read access
            fs.accessSync(filePath, fs.constants.R_OK);
        } catch (error) {
            if (error instanceof M68kError) {
                throw error;
            }

            throw M68kErrorHandler.createFileError(
                `Cannot access file: ${filePath}`,
                filePath,
                { operation },
                error as Error
            );
        }
    }

    /**
     * Validates symbol name format
     */
    static validateSymbolName(symbolName: string, operation: string): void {
        if (!symbolName || symbolName.trim().length === 0) {
            throw M68kErrorHandler.createValidationError(
                'Symbol name cannot be empty',
                { operation, symbolName }
            );
        }

        // Check for valid M68K symbol characters
        const validSymbolPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$|^\.?[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!validSymbolPattern.test(symbolName)) {
            throw M68kErrorHandler.createValidationError(
                `Invalid symbol name format: ${symbolName}`,
                { operation, symbolName }
            );
        }
    }

    /**
     * Safely parses JSON with error handling
     */
    static parseJsonSafely<T>(jsonString: string, operation: string): T | null {
        return M68kErrorHandler.withSyncErrorHandling(
            () => JSON.parse(jsonString) as T,
            { operation: `${operation} - JSON Parse` }
        );
    }

    /**
     * Creates a user-friendly error message for display
     */
    static createUserMessage(error: M68kError): string {
        switch (error.context.operation) {
            case 'go-to-definition':
                return `Could not find definition for "${error.context.symbolName || 'symbol'}"`;
            case 'find-references':
                return `Could not find references for "${error.context.symbolName || 'symbol'}"`;
            case 'rename':
                return `Cannot rename "${error.context.symbolName || 'symbol'}": ${error.message}`;
            case 'hover':
                return `Could not provide hover information: ${error.message}`;
            case 'file-parsing':
                return `Error parsing file: ${error.message}`;
            default:
                return error.message;
        }
    }
}
