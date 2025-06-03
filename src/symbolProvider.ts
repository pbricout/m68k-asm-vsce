import * as vscode from 'vscode';

export class M68kDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    
    provideDocumentSymbols(
        document: vscode.TextDocument, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.DocumentSymbol[]> {
        
        const symbols: vscode.DocumentSymbol[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Find labels
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
                
                symbols.push(symbol);
            }
            
            // Find EQU definitions
            const equMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+equ\s+(.+)/i);
            if (equMatch) {
                const symbolName = equMatch[1];
                const symbolValue = equMatch[2].split(';')[0].trim(); // Remove comment
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
                
                symbols.push(symbol);
            }
            
            // Find macro definitions
            const macroMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s+macro/i);
            if (macroMatch) {
                const macroName = macroMatch[1];
                const macroStart = line.indexOf(macroName);
                
                // Find the end of the macro
                let macroEnd = i;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim().match(/^\s*endm\b/i)) {
                        macroEnd = j;
                        break;
                    }
                }
                
                const range = new vscode.Range(
                    new vscode.Position(i, macroStart),
                    new vscode.Position(macroEnd, lines[macroEnd].length)
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
                
                symbols.push(symbol);
            }
            
            // Find section definitions
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
                
                symbols.push(symbol);
            }
        }
        
        return symbols;
    }
}