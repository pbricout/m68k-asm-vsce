import * as vscode from 'vscode';

export class M68kReferenceProvider implements vscode.ReferenceProvider {
    
    provideReferences(
        document: vscode.TextDocument, 
        position: vscode.Position, 
        context: vscode.ReferenceContext, 
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Location[]> {
        
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return [];
        }
        
        const word = document.getText(wordRange);
        const references = this.findAllReferences(document, word, context.includeDeclaration);
        
        return references;
    }
    
    private findAllReferences(document: vscode.TextDocument, symbolName: string, includeDeclaration: boolean): vscode.Location[] {
        const locations: vscode.Location[] = [];
        const text = document.getText();
        const lines = text.split('\n');
        
        const escapedSymbol = this.escapeRegex(symbolName);
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Check for label definition
            const labelDefMatch = line.match(new RegExp(`^\\s*(${escapedSymbol})\\s*:`, 'i'));
            if (labelDefMatch && includeDeclaration) {
                const character = line.indexOf(labelDefMatch[1]);
                locations.push(new vscode.Location(document.uri, new vscode.Position(i, character)));
            }
            
            // Check for EQU definition
            const equDefMatch = line.match(new RegExp(`^\\s*(${escapedSymbol})\\s+equ\\b`, 'i'));
            if (equDefMatch && includeDeclaration) {
                const character = line.indexOf(equDefMatch[1]);
                locations.push(new vscode.Location(document.uri, new vscode.Position(i, character)));
            }
            
            // Find all references (not definitions)
            const referenceRegex = new RegExp(`\\b(${escapedSymbol})\\b`, 'gi');
            let match;
            
            while ((match = referenceRegex.exec(line)) !== null) {
                // Skip if this is a label definition
                const beforeMatch = line.substring(0, match.index).trim();
                const afterMatch = line.substring(match.index + match[0].length).trim();
                
                // Skip label definitions and EQU definitions
                if (beforeMatch === '' && afterMatch.startsWith(':')) {
                    continue;
                }
                if (beforeMatch === '' && afterMatch.toLowerCase().startsWith('equ')) {
                    continue;
                }
                
                locations.push(new vscode.Location(
                    document.uri, 
                    new vscode.Position(i, match.index)
                ));
            }
        }
        
        return locations;
    }
    
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
