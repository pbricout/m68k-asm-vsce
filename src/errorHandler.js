"use strict";
/**
 * Standardized error handling utilities for M68K Assembly Language Extension
 *
 * This module provides consistent error handling patterns across all providers
 * and utilities in the extension.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.M68kErrorUtils = exports.handleErrors = exports.M68kErrorHandler = exports.M68kError = exports.ErrorSeverity = void 0;
var vscode = require("vscode");
var logger_1 = require("./logger");
/**
 * Error severity levels
 */
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["INFO"] = "info";
    ErrorSeverity["WARNING"] = "warning";
    ErrorSeverity["ERROR"] = "error";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity = exports.ErrorSeverity || (exports.ErrorSeverity = {}));
/**
 * Standardized error class for the M68K extension
 */
var M68kError = /** @class */ (function (_super) {
    __extends(M68kError, _super);
    function M68kError(message, severity, context, originalError) {
        if (severity === void 0) { severity = ErrorSeverity.ERROR; }
        var _this = _super.call(this, message) || this;
        _this.name = 'M68kError';
        _this.severity = severity;
        _this.context = context;
        _this.timestamp = new Date();
        // Preserve stack trace from original error if provided
        if (originalError && originalError.stack) {
            _this.stack = originalError.stack;
        }
        return _this;
    }
    return M68kError;
}(Error));
exports.M68kError = M68kError;
/**
 * Standardized error handler utility class
 */
var M68kErrorHandler = /** @class */ (function () {
    function M68kErrorHandler() {
    }
    /**
     * Handles errors consistently across the extension
     */
    M68kErrorHandler.handle = function (error, context) {
        var m68kError = this.normalizeError(error, context);
        // Log the error with appropriate level
        this.logError(m68kError);
        // Show user notification for critical errors
        if (m68kError.severity === ErrorSeverity.CRITICAL) {
            this.showErrorNotification(m68kError);
        }
    };
    /**
     * Wraps async operations with standardized error handling
     */
    M68kErrorHandler.withErrorHandling = function (operation, context, defaultValue) {
        if (defaultValue === void 0) { defaultValue = null; }
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, operation()];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_1 = _a.sent();
                        this.handle(error_1, context);
                        return [2 /*return*/, defaultValue];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Wraps sync operations with standardized error handling
     */
    M68kErrorHandler.withSyncErrorHandling = function (operation, context, defaultValue) {
        if (defaultValue === void 0) { defaultValue = null; }
        try {
            return operation();
        }
        catch (error) {
            this.handle(error, context);
            return defaultValue;
        }
    };
    /**
     * Creates a validation error for invalid inputs
     */
    M68kErrorHandler.createValidationError = function (message, context, severity) {
        if (severity === void 0) { severity = ErrorSeverity.WARNING; }
        return new M68kError(message, severity, __assign(__assign({}, context), { operation: "".concat(context.operation, " - Validation") }));
    };
    /**
     * Creates a file operation error
     */
    M68kErrorHandler.createFileError = function (message, filePath, context, originalError) {
        return new M68kError(message, ErrorSeverity.ERROR, __assign(__assign({}, context), { file: filePath, operation: "".concat(context.operation, " - File Operation") }), originalError);
    };
    /**
     * Creates a symbol resolution error
     */
    M68kErrorHandler.createSymbolError = function (message, symbolName, context, severity) {
        if (severity === void 0) { severity = ErrorSeverity.WARNING; }
        return new M68kError(message, severity, __assign(__assign({}, context), { symbolName: symbolName, operation: "".concat(context.operation, " - Symbol Resolution") }));
    };
    /**
     * Creates a parser error
     */
    M68kErrorHandler.createParserError = function (message, filePath, line, context, originalError) {
        return new M68kError(message, ErrorSeverity.ERROR, __assign(__assign({}, context), { file: filePath, line: line, operation: "".concat(context.operation, " - Parser") }), originalError);
    };
    /**
     * Normalizes different error types to M68kError
     */
    M68kErrorHandler.normalizeError = function (error, context) {
        if (error instanceof M68kError) {
            return error;
        }
        if (error instanceof Error) {
            return new M68kError(error.message, ErrorSeverity.ERROR, context, error);
        }
        // Handle string errors or unknown error types
        var message = typeof error === 'string' ? error : 'Unknown error occurred';
        return new M68kError(message, ErrorSeverity.ERROR, context);
    };
    /**
     * Logs error with appropriate formatting
     */
    M68kErrorHandler.logError = function (error) {
        var contextInfo = this.formatContextInfo(error.context);
        var fullMessage = "".concat(error.message).concat(contextInfo);
        switch (error.severity) {
            case ErrorSeverity.INFO:
                logger_1.M68kLogger.info(fullMessage);
                break;
            case ErrorSeverity.WARNING:
                logger_1.M68kLogger.warn(fullMessage);
                break;
            case ErrorSeverity.ERROR:
                logger_1.M68kLogger.error(fullMessage);
                break;
            case ErrorSeverity.CRITICAL:
                logger_1.M68kLogger.error("CRITICAL: ".concat(fullMessage));
                break;
        }
        // Log stack trace for errors and critical issues
        if (error.stack && (error.severity === ErrorSeverity.ERROR || error.severity === ErrorSeverity.CRITICAL)) {
            logger_1.M68kLogger.debug("Stack trace: ".concat(error.stack));
        }
    };
    /**
     * Formats context information for logging
     */
    M68kErrorHandler.formatContextInfo = function (context) {
        var parts = [];
        if (context.file) {
            parts.push("file: ".concat(context.file));
        }
        if (context.line !== undefined) {
            parts.push("line: ".concat(context.line + 1)); // Convert to 1-based line numbers
        }
        if (context.character !== undefined) {
            parts.push("character: ".concat(context.character));
        }
        if (context.symbolName) {
            parts.push("symbol: ".concat(context.symbolName));
        }
        if (context.operation) {
            parts.push("operation: ".concat(context.operation));
        }
        if (context.additionalInfo) {
            var additional = Object.entries(context.additionalInfo)
                .map(function (_a) {
                var key = _a[0], value = _a[1];
                return "".concat(key, ": ").concat(value);
            })
                .join(', ');
            if (additional) {
                parts.push(additional);
            }
        }
        return parts.length > 0 ? " [".concat(parts.join(', '), "]") : '';
    };
    /**
     * Shows error notification to user for critical errors
     */
    M68kErrorHandler.showErrorNotification = function (error) {
        var action = 'Show Output';
        vscode.window.showErrorMessage("M68K Assembly: ".concat(error.message), action).then(function (selectedAction) {
            if (selectedAction === action) {
                logger_1.M68kLogger.show();
            }
        });
    };
    return M68kErrorHandler;
}());
exports.M68kErrorHandler = M68kErrorHandler;
/**
 * Decorator for automatic error handling in class methods
 */
function handleErrors(context) {
    if (context === void 0) { context = {}; }
    return function (target, propertyKey, descriptor) {
        var originalMethod = descriptor.value;
        descriptor.value = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var errorContext = __assign({ operation: "".concat(target.constructor.name, ".").concat(propertyKey) }, context);
            try {
                var result = originalMethod.apply(this, args);
                // Handle async methods
                if (result instanceof Promise) {
                    return result["catch"](function (error) {
                        M68kErrorHandler.handle(error, errorContext);
                        return null;
                    });
                }
                return result;
            }
            catch (error) {
                M68kErrorHandler.handle(error, errorContext);
                return null;
            }
        };
        return descriptor;
    };
}
exports.handleErrors = handleErrors;
/**
 * Utility functions for common error scenarios
 */
var M68kErrorUtils = /** @class */ (function () {
    function M68kErrorUtils() {
    }
    /**
     * Validates that a file exists and is readable
     */
    M68kErrorUtils.validateFileAccess = function (filePath, operation) {
        var fs = require('fs');
        try {
            if (!fs.existsSync(filePath)) {
                throw M68kErrorHandler.createFileError("File not found: ".concat(filePath), filePath, { operation: operation });
            }
            // Test read access
            fs.accessSync(filePath, fs.constants.R_OK);
        }
        catch (error) {
            if (error instanceof M68kError) {
                throw error;
            }
            throw M68kErrorHandler.createFileError("Cannot access file: ".concat(filePath), filePath, { operation: operation }, error);
        }
    };
    /**
     * Validates symbol name format
     */
    M68kErrorUtils.validateSymbolName = function (symbolName, operation) {
        if (!symbolName || symbolName.trim().length === 0) {
            throw M68kErrorHandler.createValidationError('Symbol name cannot be empty', { operation: operation, symbolName: symbolName });
        }
        // Check for valid M68K symbol characters
        var validSymbolPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$|^\.?[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!validSymbolPattern.test(symbolName)) {
            throw M68kErrorHandler.createValidationError("Invalid symbol name format: ".concat(symbolName), { operation: operation, symbolName: symbolName });
        }
    };
    /**
     * Safely parses JSON with error handling
     */
    M68kErrorUtils.parseJsonSafely = function (jsonString, operation) {
        return M68kErrorHandler.withSyncErrorHandling(function () { return JSON.parse(jsonString); }, { operation: "".concat(operation, " - JSON Parse") });
    };
    /**
     * Creates a user-friendly error message for display
     */
    M68kErrorUtils.createUserMessage = function (error) {
        switch (error.context.operation) {
            case 'go-to-definition':
                return "Could not find definition for \"".concat(error.context.symbolName || 'symbol', "\"");
            case 'find-references':
                return "Could not find references for \"".concat(error.context.symbolName || 'symbol', "\"");
            case 'rename':
                return "Cannot rename \"".concat(error.context.symbolName || 'symbol', "\": ").concat(error.message);
            case 'hover':
                return "Could not provide hover information: ".concat(error.message);
            case 'file-parsing':
                return "Error parsing file: ".concat(error.message);
            default:
                return error.message;
        }
    };
    return M68kErrorUtils;
}());
exports.M68kErrorUtils = M68kErrorUtils;
