import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';

export class M68kDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    async provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.DocumentSymbol[]> {
        const symbols: vscode.DocumentSymbol[] = [];
        const mainFilePath = document.uri.fsPath;
        const baseDir = path.dirname(mainFilePath);
        const projectRoot = getProjectRoot(document);
        const fallbackPath = getIncludeFallbackPath(projectRoot);

        // Helper to parse a file and collect symbols
        const parseFile = (filePath: string, baseDir: string, visited = new Set<string>()): vscode.DocumentSymbol[] => {
            if (visited.has(filePath)) return [];
            visited.add(filePath);
            let fileText: string;
            try {
                fileText = fs.readFileSync(filePath, 'utf8');
            } catch {
                return [];
            }
            const fileLines = fileText.split('\n');
            const fileSymbols: vscode.DocumentSymbol[] = [];
            for (let i = 0; i < fileLines.length; i++) {
                const line = fileLines[i];
                // Labels
                const labelMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
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
                // EQU
                const equMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+equ\s+(.+)/i);
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
                // MACRO
                const macroMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+macro/i);
                if (macroMatch) {
                    const macroName = macroMatch[1];
                    const macroStart = line.indexOf(macroName);
                    let macroEnd = i;
                    for (let j = i + 1; j < fileLines.length; j++) {
                        if (fileLines[j].trim().match(/^\s*endm\b/i)) {
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
                // SECTION
                const sectionMatch = line.match(/^\s*section\s+["']?([^"',\s]+)["']?/i);
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
                // INCLUDE
                const includeMatch = line.match(/^\s*include\s+["']?([^"'\s]+)["']?/i);
                if (includeMatch) {
                    const includePath = includeMatch[1];
                    const resolved = resolveIncludePath(includePath, baseDir, projectRoot, fallbackPath);
                    if (resolved) {
                        fileSymbols.push(...parseFile(resolved, path.dirname(resolved), visited));
                    }
                }
            }
            return fileSymbols;
        };

        // Parse the main file and all includes
        const allSymbols = parseFile(mainFilePath, baseDir);
        symbols.push(...allSymbols);
        return symbols;
    }
}