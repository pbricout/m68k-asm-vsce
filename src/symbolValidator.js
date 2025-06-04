"use strict";
exports.__esModule = true;
exports.M68kSymbolValidator = void 0;
var regexPatterns_1 = require("./regexPatterns");
/**
 * Utilities for validating M68K assembly symbols and names
 */
var M68kSymbolValidator = /** @class */ (function () {
    function M68kSymbolValidator() {
    }
    /**
     * Check if a symbol name is valid for M68K assembly
     */
    M68kSymbolValidator.isValidSymbolName = function (name) {
        return regexPatterns_1.M68kRegexPatterns.SYMBOL_NAME.test(name);
    };
    /**
     * Check if a symbol can be renamed (not a reserved instruction or register)
     */
    M68kSymbolValidator.isValidSymbolForRename = function (symbolName) {
        if (!this.isValidSymbolName(symbolName)) {
            return {
                isValid: false,
                reason: 'Invalid symbol name format'
            };
        }
        var lowerName = symbolName.toLowerCase();
        // Check if it's a reserved instruction
        if (regexPatterns_1.M68kRegexPatterns.isValidInstruction(lowerName)) {
            return {
                isValid: false,
                reason: 'Cannot rename instruction'
            };
        }
        // Check if it's a register name
        if (this.isRegisterName(lowerName)) {
            return {
                isValid: false,
                reason: 'Cannot rename register'
            };
        }
        // Check if it's a directive
        if (this.isDirective(lowerName)) {
            return {
                isValid: false,
                reason: 'Cannot rename assembler directive'
            };
        }
        return { isValid: true };
    };
    /**
     * Check if a name is a register
     */
    M68kSymbolValidator.isRegisterName = function (name) {
        var registers = [
            'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7',
            'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
            'sp', 'pc', 'sr', 'ccr', 'usp', 'ssp'
        ];
        return registers.includes(name.toLowerCase());
    };
    /**
     * Check if a name is an assembler directive
     */
    M68kSymbolValidator.isDirective = function (name) {
        var directives = [
            'org', 'equ', 'dc', 'ds', 'dcb', 'even', 'align',
            'include', 'incbin', 'macro', 'endm', 'section',
            'text', 'data', 'bss', 'end', 'if', 'ifdef', 'ifndef',
            'ifd', 'ifnd', 'else', 'endif', 'endc'
        ];
        return directives.includes(name.toLowerCase());
    };
    /**
     * Generate suggestions for invalid symbol names
     */
    M68kSymbolValidator.suggestValidName = function (invalidName) {
        // Remove invalid characters
        var suggestion = invalidName.replace(/[^a-zA-Z0-9_]/g, '_');
        // Ensure it starts with a letter or underscore
        if (suggestion.length > 0 && /^[0-9]/.test(suggestion)) {
            suggestion = '_' + suggestion;
        }
        // Ensure it's not empty
        if (suggestion.length === 0) {
            suggestion = '_symbol';
        }
        // Avoid conflicts with reserved names
        if (!this.isValidSymbolForRename(suggestion)) {
            suggestion = suggestion + '_user';
        }
        return suggestion;
    };
    return M68kSymbolValidator;
}());
exports.M68kSymbolValidator = M68kSymbolValidator;
