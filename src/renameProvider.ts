import * as vscode from 'vscode';

export class M68kRenameProvider implements vscode.RenameProvider {
    
    prepareRename(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Range | { range: vscode.Range; placeholder: string }> {
        
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            throw new Error('Cannot rename this element');
        }
        
        const word = document.getText(wordRange);
        
        // Check if this is a valid symbol that can be renamed
        if (this.isValidSymbolForRename(document, position, word)) {
            return {
                range: wordRange,
                placeholder: word
            };
        }
        
        throw new Error('Cannot rename this element');
    }
    
    provideRenameEdits(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        newName: string, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.WorkspaceEdit> {
        
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        
        const oldName = document.getText(wordRange);
        
        // Validate new name
        if (!this.isValidSymbolName(newName)) {
            throw new Error('Invalid symbol name');
        }
        
        const workspaceEdit = new vscode.WorkspaceEdit();
        const references = this.findAllOccurrences(document, oldName);
        
        references.forEach(location => {
            workspaceEdit.replace(document.uri, location.range, newName);
        });
        
        return workspaceEdit;
    }
    
    private isValidSymbolForRename(document: vscode.TextDocument, position: vscode.Position, symbolName: string): boolean {
        // Check if it's a register (cannot rename)
        if (symbolName.match(/^[dDaA][0-7]$/) || 
            symbolName.match(/^(sp|pc|sr|ccr|usp|ssp)$/i)) {
            return false;
        }
        
        // Check if it's an instruction (cannot rename)
        const instructions = [
            'move', 'movea', 'movem', 'movep', 'moveq', 'add', 'adda', 'addi', 'addq', 'addx',
            'sub', 'suba', 'subi', 'subq', 'subx', 'muls', 'mulu', 'divs', 'divu', 'and', 'andi',
            'or', 'ori', 'eor', 'eori', 'not', 'cmp', 'cmpa', 'cmpi', 'cmpm', 'tst', 'bra', 'bsr',
            'bcc', 'bcs', 'beq', 'bne', 'bge', 'bgt', 'ble', 'blt', 'bhi', 'bls', 'bpl', 'bmi',
            'bvc', 'bvs', 'jmp', 'jsr', 'rts', 'rtr', 'rte', 'lea', 'pea', 'clr', 'neg', 'ext',
            'swap', 'exg', 'asl', 'asr', 'lsl', 'lsr', 'rol', 'ror', 'roxl', 'roxr', 'btst', 'bset',
            'bclr', 'bchg', 'trap', 'trapv', 'chk', 'stop', 'reset', 'nop', 'illegal'
        ];
        
        if (instructions.includes(symbolName.toLowerCase())) {
            return false;
        }
        
        // Check if it's a user-defined symbol (label or constant)
        return this.isUserDefinedSymbol(document, symbolName);
    }
    
    private isUserDefinedSymbol(document: vscode.TextDocument, symbolName: string): boolean {
        const text = document.getText();
        const lines = text.split('\n');
        
        const escapedSymbol = this.escapeRegex(symbolName);
        
        // Look for label definition or EQU definition
        for (const line of lines) {
            if (line.match(new RegExp(`^\\s*(${escapedSymbol})\\s*:`, 'i')) ||
                line.match(new RegExp(`^\\s*(${escapedSymbol})\\s+equ\\b`, 'i'))) {
                return true;
            }
        }
        
        return false;
    }
    
    private isValidSymbolName(name: string): boolean {
        // M68K symbol names must start with letter or underscore, followed by letters, digits, or underscores
        return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name);
    }
    
    private findAllOccurrences(document: vscode.TextDocument, symbolName: string): vscode.Location[] {
        const locations: vscode.Location[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        const escapedSymbol = this.escapeRegex(symbolName);
        const symbolRegex = new RegExp(`\\b(${escapedSymbol})\\b`, 'gi');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            let match;
            
            while ((match = symbolRegex.exec(line)) !== null) {
                const range = new vscode.Range(
                    new vscode.Position(i, match.index),
                    new vscode.Position(i, match.index + match[0].length)
                );
                locations.push(new vscode.Location(document.uri, range));
            }
        }
        
        return locations;
    }
    
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}