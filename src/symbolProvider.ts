import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';
import { M68kFileParser } from './fileParser';
import { M68kRegexPatterns } from './regexPatterns';
import { M68kLogger } from './logger';

export class M68kDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    async provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const context = M68kFileParser.createParseContext(document);
        
        // Helper to parse a file and collect symbols using shared utilities
        const parseFile = (filePath: string, baseDir: string, visited = new Set<string>()): vscode.DocumentSymbol[] => {
            if (visited.has(filePath)) return [];
            visited.add(filePath);
            
            let fileText: string;
            try {
                fileText = fs.readFileSync(filePath, 'utf8');
            } catch (error) {
                M68kLogger.logFailure(`Failed to read file: ${filePath}`);
                return [];
            }
            
            const fileLines = fileText.split('\n');
            const fileSymbols: vscode.DocumentSymbol[] = [];
            
            for (let i = 0; i < fileLines.length; i++) {
                const line = fileLines[i];
                
                // Labels using regex patterns
                const labelMatch = line.match(M68kRegexPatterns.LABEL_DEFINITION);
                if (labelMatch) {
                    const labelName = labelMatch[1];
                    const labelStart = line.indexOf(labelName);
                    const range = new vscode.Range(
                        new vscode.Position(i, labelStart),
                        new vscode.Position(i, labelStart + labelName.length)
                    );
                    const symbol = new vscode.DocumentSymbol(
                        labelName,
                        'Label',
                        vscode.SymbolKind.Function,
                        range,
                        range
                    );
                    fileSymbols.push(symbol);
                }
                
                // EQU definitions using regex patterns
                const equMatch = line.match(M68kRegexPatterns.EQU_DEFINITION);
                if (equMatch) {
                    const symbolName = equMatch[1];
                    const symbolValue = equMatch[2].split(';')[0].trim();
                    const symbolStart = line.indexOf(symbolName);
                    const range = new vscode.Range(
                        new vscode.Position(i, symbolStart),
                        new vscode.Position(i, symbolStart + symbolName.length)
                    );
                    const symbol = new vscode.DocumentSymbol(
                        `${symbolName} = ${symbolValue}`,
                        'Constant',
                        vscode.SymbolKind.Constant,
                        range,
                        range
                    );
                    fileSymbols.push(symbol);
                }                
                // Macro definitions using regex patterns
                const macroMatch = line.match(M68kRegexPatterns.MACRO_DEFINITION);
                if (macroMatch) {
                    const macroName = macroMatch[1];
                    const macroStart = line.indexOf(macroName);
                    let macroEnd = i;
                    
                    // Find matching ENDM
                    for (let j = i + 1; j < fileLines.length; j++) {
                        if (M68kRegexPatterns.MACRO_END.test(fileLines[j].trim())) {
                            macroEnd = j;
                            break;
                        }
                    }
                    
                    const range = new vscode.Range(
                        new vscode.Position(i, macroStart),
                        new vscode.Position(macroEnd, fileLines[macroEnd]?.length || 0)
                    );
                    const selectionRange = new vscode.Range(
                        new vscode.Position(i, macroStart),
                        new vscode.Position(i, macroStart + macroName.length)
                    );
                    const symbol = new vscode.DocumentSymbol(
                        macroName,
                        'Macro',
                        vscode.SymbolKind.Function,
                        range,
                        selectionRange
                    );
                    fileSymbols.push(symbol);
                }
                
                // Section definitions using regex patterns
                const sectionMatch = line.match(M68kRegexPatterns.SECTION_DEFINITION);
                if (sectionMatch) {
                    const sectionName = sectionMatch[1];
                    const sectionStart = line.indexOf('section');
                    const range = new vscode.Range(
                        new vscode.Position(i, sectionStart),
                        new vscode.Position(i, line.length)
                    );
                    const symbol = new vscode.DocumentSymbol(
                        sectionName,
                        'Section',
                        vscode.SymbolKind.Namespace,
                        range,
                        range
                    );
                    fileSymbols.push(symbol);
                }
                
                // Include statements - process included files recursively
                const includeMatch = line.match(M68kRegexPatterns.INCLUDE_STATEMENT);
                if (includeMatch) {
                    const includePath = includeMatch[1];
                    const resolved = resolveIncludePath(includePath, baseDir, context.projectRoot, context.fallbackPath);
                    if (resolved) {
                        const includeSymbols = parseFile(resolved, path.dirname(resolved), visited);
                        fileSymbols.push(...includeSymbols);
                    }
                }
            }
            
            return fileSymbols;
        };

        // Parse the main file and all includes
        const allSymbols = parseFile(context.filePath, context.baseDir);
        symbols.push(...allSymbols);
        
        M68kLogger.logSuccess(`Found ${symbols.length} symbols in document`);
        return symbols;
    }
}