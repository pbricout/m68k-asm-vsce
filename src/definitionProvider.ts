import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';
import { M68kLogger } from './logger';
import { M68kRegexPatterns } from './regexPatterns';
import { M68kFileParser } from './fileParser';

export class M68kDefinitionProvider implements vscode.DefinitionProvider {
    // M68K instruction mnemonics that should not be treated as user symbols
    private static readonly M68K_INSTRUCTIONS = [
        'MOVE', 'MOVEA', 'MOVEM', 'MOVEP', 'MOVEQ',
        'ADD', 'ADDA', 'ADDI', 'ADDQ', 'ADDX',
        'SUB', 'SUBA', 'SUBI', 'SUBQ', 'SUBX',
        'MULS', 'MULU', 'DIVS', 'DIVU',
        'ASL', 'ASR', 'LSL', 'LSR', 'ROL', 'ROR', 'ROXL', 'ROXR',
        'CMP', 'CMPA', 'CMPI', 'CMPM', 'TST',
        'BRA', 'BSR', 'BCC', 'BCS', 'BEQ', 'BNE', 'BGE', 'BGT', 'BLE', 'BLT',
        'BHI', 'BLS', 'BPL', 'BMI', 'BVC', 'BVS',
        'JMP', 'JSR', 'RTS', 'RTR', 'RTE',
        'BTST', 'BSET', 'BCLR', 'BCHG',
        'TRAP', 'TRAPV', 'CHK', 'STOP', 'RESET', 'NOP', 'ILLEGAL',
        'AND', 'ANDI', 'OR', 'ORI', 'EOR', 'EORI', 'NOT',
        'NEG', 'NEGX', 'CLR', 'EXT', 'SWAP',
        'PEA', 'LEA', 'LINK', 'UNLK',
        'ABCD', 'SBCD', 'NBCD', 'TAS'
    ];

    // M68K registers that should not be treated as user symbols
    private static readonly M68K_REGISTERS = [
        'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7',
        'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
        'SP', 'PC', 'SR', 'CCR', 'USP', 'SSP'
    ];

    /**
     * Check if a word is a reserved M68K instruction or register
     */
    private isReservedWord(word: string): boolean {
        const upperWord = word.toUpperCase();
        return M68kDefinitionProvider.M68K_INSTRUCTIONS.includes(upperWord) ||
               M68kDefinitionProvider.M68K_REGISTERS.includes(upperWord);
    }

    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        const word = document.getText(wordRange);
        
        // Don't provide definitions for M68K instructions and registers
        if (this.isReservedWord(word)) {
            M68kLogger.log(`Skipping definition for reserved word: ${word.toUpperCase()}`);
            return null;
        }
        
        const line = document.lineAt(position.line).text;
          // Check if the cursor is on an include statement
        const includeMatch = line.match(M68kRegexPatterns.INCLUDE_STATEMENT);
        if (includeMatch) {
            // Extract the path - could be in group 1 (quoted) or group 2 (unquoted)
            const includePath = includeMatch[1] || includeMatch[2];
            
            // Find the actual position of the include path in the line
            const includeKeywordMatch = line.match(/^\s*include\s+/i);
            if (includeKeywordMatch) {
                // Find the start of the path (after 'include' keyword and optional quote)
                const afterKeyword = line.substring(includeKeywordMatch[0].length);
                const quoteMatch = afterKeyword.match(/^["']?/);
                const includeStartIndex = includeKeywordMatch[0].length + (quoteMatch?.[0].length || 0);
                const includeEndIndex = includeStartIndex + includePath.length;
                const cursorIndex = position.character;
                
                M68kLogger.log(`Include detection: line="${line.trim()}", path="${includePath}", cursor=${cursorIndex}, range=[${includeStartIndex},${includeEndIndex}]`);
                
                if (cursorIndex >= includeStartIndex && cursorIndex <= includeEndIndex) {
                    // Cursor is on the include path, resolve it to a file
                    const context = M68kFileParser.createParseContext(document);
                    
                    M68kLogger.log(`Resolving include path: "${includePath}"`);
                    const resolved = resolveIncludePath(includePath, context.baseDir, context.projectRoot, context.fallbackPath);
                    if (resolved && fs.existsSync(resolved)) {
                        M68kLogger.logSuccess(`Include resolved to: ${resolved}`);
                        return new vscode.Location(vscode.Uri.file(resolved), new vscode.Position(0, 0));
                    } else {
                        M68kLogger.logFailure(`Include file not found: ${includePath}`);
                        return null;
                    }
                }
            }
        }
          // If not on an include path, proceed with symbol search
        const context = M68kFileParser.createParseContext(document);
        const symbolInfo = M68kFileParser.findSymbolDefinitionWithScoping(word, context, position);
        
        if (symbolInfo) {
            M68kLogger.logSuccess(`Found ${symbolInfo.type} definition: ${symbolInfo.name} at line ${symbolInfo.line + 1}`);
            return new vscode.Location(
                vscode.Uri.file(symbolInfo.filePath), 
                new vscode.Position(symbolInfo.line, symbolInfo.character)
            );
        }
        
        M68kLogger.log(`No definition found for symbol: ${word}`);
        return null;
    }
}
