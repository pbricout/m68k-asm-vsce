import { M68kRegexPatterns } from './regexPatterns';

export interface ValidationResult {
    isValid: boolean;
    reason?: string;
}

/**
 * Utilities for validating M68K assembly symbols and names
 */
export class M68kSymbolValidator {
    
    /**
     * Check if a symbol name is valid for M68K assembly
     */
    static isValidSymbolName(name: string): boolean {
        return M68kRegexPatterns.SYMBOL_NAME.test(name);
    }
    
    /**
     * Check if a symbol can be renamed (not a reserved instruction or register)
     */
    static isValidSymbolForRename(symbolName: string): ValidationResult {
        if (!this.isValidSymbolName(symbolName)) {
            return {
                isValid: false,
                reason: 'Invalid symbol name format'
            };
        }
        
        const lowerName = symbolName.toLowerCase();
        
        // Check if it's a reserved instruction
        if (M68kRegexPatterns.isValidInstruction(lowerName)) {
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
    }
    
    /**
     * Check if a name is a register
     */
    static isRegisterName(name: string): boolean {
        const registers = [
            'd0', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7',
            'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
            'sp', 'pc', 'sr', 'ccr', 'usp', 'ssp'
        ];
        return registers.includes(name.toLowerCase());
    }
    
    /**
     * Check if a name is an assembler directive
     */
    static isDirective(name: string): boolean {
        const directives = [
            'org', 'equ', 'dc', 'ds', 'dcb', 'even', 'align',
            'include', 'incbin', 'macro', 'endm', 'section',
            'text', 'data', 'bss', 'end', 'if', 'ifdef', 'ifndef',
            'ifd', 'ifnd', 'else', 'endif', 'endc'
        ];
        return directives.includes(name.toLowerCase());
    }
    
    /**
     * Generate suggestions for invalid symbol names
     */
    static suggestValidName(invalidName: string): string {
        // Remove invalid characters
        let suggestion = invalidName.replace(/[^a-zA-Z0-9_]/g, '_');
        
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
    }
}
