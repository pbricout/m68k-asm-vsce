/**
 * Centralized regex patterns for M68K Assembly language parsing
 */

export class M68kRegexPatterns {
    // Symbol name validation
    static readonly SYMBOL_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    
    // Symbol escaping utility
    static escapeSymbol(symbolName: string): string {
        return symbolName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
      // Label patterns
    static readonly LABEL_DEFINITION = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/;
    static labelDefinition(symbolName: string): RegExp {
        return new RegExp(`^\\s*(${this.escapeSymbol(symbolName)})\\s*:`, 'i');
    }
    
    static labelReference(symbolName: string): RegExp {
        return new RegExp(`\\b(${this.escapeSymbol(symbolName)})\\b`, 'gi');
    }
    
    // EQU patterns
    static readonly EQU_DEFINITION = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+equ\s+(.+)/i;
    static equDefinition(symbolName: string): RegExp {
        return new RegExp(`^\\s*(${this.escapeSymbol(symbolName)})\\s+equ\\b`, 'i');
    }
    
    // Macro patterns
    static readonly MACRO_DEFINITION = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+macro/i;
    static macroDefinition(symbolName: string): RegExp {
        return new RegExp(`^\\s*(${this.escapeSymbol(symbolName)})\\s+macro\\b`, 'i');
    }
    
    // SET patterns
    static setDefinition(symbolName: string): RegExp {
        return new RegExp(`^\\s*(${this.escapeSymbol(symbolName)})\\s+set\\b`, 'i');
    }
    
    // Assignment patterns
    static assignmentDefinition(symbolName: string): RegExp {
        return new RegExp(`^\\s*(${this.escapeSymbol(symbolName)})\\s*=`, 'i');
    }
      // Include patterns
    static readonly INCLUDE_STATEMENT = /^\s*include\s+["']?([^"'\s]+)["']?/i;
    
    // Section patterns
    static readonly SECTION_DEFINITION = /^\s*section\s+["']?([^"',\s]+)["']?/i;
    
    // Instruction patterns
    static readonly INSTRUCTION_WITH_SIZE = /^([a-zA-Z]+)\.([bwl])\s/i;
    static readonly INSTRUCTION_BASIC = /^([a-zA-Z]+)\s/i;
    
    // Folding patterns
    static readonly REGION_START = /^;\s*#region\b/i;
    static readonly REGION_END = /^;\s*#endregion\b/i;
    static readonly MACRO_START = /^\s*\w+\s+macro\b/i;
    static readonly MACRO_END = /^\s*endm\b/i;
    static readonly CONDITIONAL_START = /^\s*(ifnd|ifd|ifdef|ifndef)\b/i;
    static readonly CONDITIONAL_END = /^\s*endc\b/i;
    
    // M68K instruction set validation
    static readonly M68K_INSTRUCTIONS = new Set([
        'move', 'movea', 'movem', 'movep', 'moveq', 'lea', 'pea', 'swap', 'exg',
        'add', 'adda', 'addi', 'addq', 'addx', 'sub', 'suba', 'subi', 'subq', 'subx',
        'muls', 'mulu', 'divs', 'divu', 'and', 'andi', 'or', 'ori', 'eor', 'eori', 'not',
        'cmp', 'cmpa', 'cmpi', 'cmpm', 'tst', 'bra', 'bsr', 'bcc', 'bcs', 'beq', 'bne',
        'bge', 'bgt', 'ble', 'blt', 'bhi', 'bls', 'bpl', 'bmi', 'bvc', 'bvs',
        'jmp', 'jsr', 'rts', 'rtr', 'rte', 'clr', 'neg', 'ext', 'asl', 'asr', 'lsl', 'lsr',
        'rol', 'ror', 'roxl', 'roxr', 'btst', 'bset', 'bclr', 'bchg', 'trap', 'trapv',
        'chk', 'stop', 'reset', 'nop', 'illegal'
    ]);
    
    static isValidInstruction(instruction: string): boolean {
        return this.M68K_INSTRUCTIONS.has(instruction.toLowerCase());
    }
}
