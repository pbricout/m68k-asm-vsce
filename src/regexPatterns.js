"use strict";
/**
 * Centralized regex patterns for M68K Assembly language parsing
 */
exports.__esModule = true;
exports.M68kRegexPatterns = void 0;
var M68kRegexPatterns = /** @class */ (function () {
    function M68kRegexPatterns() {
    }
    // Symbol escaping utility
    M68kRegexPatterns.escapeSymbol = function (symbolName) {
        return symbolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };
    M68kRegexPatterns.labelDefinition = function (symbolName) {
        return new RegExp("^\\s*(".concat(this.escapeSymbol(symbolName), ")\\s*:"), 'i');
    };
    M68kRegexPatterns.labelReference = function (symbolName) {
        return new RegExp("\\b(".concat(this.escapeSymbol(symbolName), ")\\b"), 'gi');
    };
    M68kRegexPatterns.equDefinition = function (symbolName) {
        return new RegExp("^\\s*(".concat(this.escapeSymbol(symbolName), ")\\s+equ\\b"), 'i');
    };
    M68kRegexPatterns.macroDefinition = function (symbolName) {
        return new RegExp("^\\s*(".concat(this.escapeSymbol(symbolName), ")\\s+macro\\b"), 'i');
    };
    // SET patterns
    M68kRegexPatterns.setDefinition = function (symbolName) {
        return new RegExp("^\\s*(".concat(this.escapeSymbol(symbolName), ")\\s+set\\b"), 'i');
    };
    // Assignment patterns
    M68kRegexPatterns.assignmentDefinition = function (symbolName) {
        return new RegExp("^\\s*(".concat(this.escapeSymbol(symbolName), ")\\s*="), 'i');
    };
    M68kRegexPatterns.isValidInstruction = function (instruction) {
        return this.M68K_INSTRUCTIONS.has(instruction.toLowerCase());
    };
    // Symbol name validation
    M68kRegexPatterns.SYMBOL_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    // Label patterns
    M68kRegexPatterns.LABEL_DEFINITION = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/;
    // EQU patterns
    M68kRegexPatterns.EQU_DEFINITION = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+equ\s+(.+)/i;
    // Macro patterns
    M68kRegexPatterns.MACRO_DEFINITION = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+macro/i;
    // Include patterns
    M68kRegexPatterns.INCLUDE_STATEMENT = /^\s*include\s+["']?([^"'\s]+)["']?/i;
    // Section patterns
    M68kRegexPatterns.SECTION_DEFINITION = /^\s*section\s+["']?([^"',\s]+)["']?/i;
    // Instruction patterns
    M68kRegexPatterns.INSTRUCTION_WITH_SIZE = /^([a-zA-Z]+)\.([bwl])\s/i;
    M68kRegexPatterns.INSTRUCTION_BASIC = /^([a-zA-Z]+)\s/i;
    // Folding patterns
    M68kRegexPatterns.REGION_START = /^;\s*#region\b/i;
    M68kRegexPatterns.REGION_END = /^;\s*#endregion\b/i;
    M68kRegexPatterns.MACRO_START = /^\s*\w+\s+macro\b/i;
    M68kRegexPatterns.MACRO_END = /^\s*endm\b/i;
    M68kRegexPatterns.CONDITIONAL_START = /^\s*(ifnd|ifd|ifdef|ifndef)\b/i;
    M68kRegexPatterns.CONDITIONAL_END = /^\s*endc\b/i;
    // M68K instruction set validation
    M68kRegexPatterns.M68K_INSTRUCTIONS = new Set([
        'move', 'movea', 'movem', 'movep', 'moveq', 'lea', 'pea', 'swap', 'exg',
        'add', 'adda', 'addi', 'addq', 'addx', 'sub', 'suba', 'subi', 'subq', 'subx',
        'muls', 'mulu', 'divs', 'divu', 'and', 'andi', 'or', 'ori', 'eor', 'eori', 'not',
        'cmp', 'cmpa', 'cmpi', 'cmpm', 'tst', 'bra', 'bsr', 'bcc', 'bcs', 'beq', 'bne',
        'bge', 'bgt', 'ble', 'blt', 'bhi', 'bls', 'bpl', 'bmi', 'bvc', 'bvs',
        'jmp', 'jsr', 'rts', 'rtr', 'rte', 'clr', 'neg', 'ext', 'asl', 'asr', 'lsl', 'lsr',
        'rol', 'ror', 'roxl', 'roxr', 'btst', 'bset', 'bclr', 'bchg', 'trap', 'trapv',
        'chk', 'stop', 'reset', 'nop', 'illegal'
    ]);
    return M68kRegexPatterns;
}());
exports.M68kRegexPatterns = M68kRegexPatterns;
