"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.M68kLogger = void 0;
var vscode = require("vscode");
var M68kLogger = /** @class */ (function () {
    function M68kLogger() {
    }
    M68kLogger.getOutputChannel = function () {
        if (!this.outputChannel) {
            this.outputChannel = vscode.window.createOutputChannel('M68K Assembly');
        }
        return this.outputChannel;
    };
    M68kLogger.formatMessage = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        var timestamp = new Date().toLocaleTimeString();
        var formattedArgs = args.length > 0 ? ' ' + args.map(function (arg) {
            return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
        }).join(' ') : '';
        return "[".concat(timestamp, "] ").concat(this.PREFIX, " ").concat(message).concat(formattedArgs);
    };
    M68kLogger.log = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray([message], args, false)));
    };
    M68kLogger.warn = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\u26A0 ".concat(message)], args, false)));
    };
    M68kLogger.error = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\u274C ".concat(message)], args, false)));
    };
    M68kLogger.info = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\u2139 ".concat(message)], args, false)));
    };
    M68kLogger.debug = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\uD83D\uDC1B ".concat(message)], args, false)));
    };
    // Convenience methods for common logging patterns
    M68kLogger.logSuccess = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\u2713 ".concat(message)], args, false)));
    };
    M68kLogger.logFailure = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\u2717 ".concat(message)], args, false)));
    };
    M68kLogger.logWarning = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["\u26A0 ".concat(message)], args, false)));
    };
    M68kLogger.logProgress = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        this.getOutputChannel().appendLine(this.formatMessage.apply(this, __spreadArray(["  ".concat(message)], args, false)));
    };
    // Utility methods for output channel management
    M68kLogger.show = function () {
        this.getOutputChannel().show();
    };
    M68kLogger.clear = function () {
        this.getOutputChannel().clear();
    };
    M68kLogger.dispose = function () {
        if (this.outputChannel) {
            this.outputChannel.dispose();
            this.outputChannel = null;
        }
    };
    M68kLogger.PREFIX = '[M68K-ASM]';
    M68kLogger.outputChannel = null;
    return M68kLogger;
}());
exports.M68kLogger = M68kLogger;
