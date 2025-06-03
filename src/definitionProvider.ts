import * as vscode from 'vscode';

export class M68kDefinitionProvider implements vscode.DefinitionProvider {
    
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
        const labelDefinition = this.findLabelDefinition(document, word);
        
        if (labelDefinition) {
            return new vscode.Location(document.uri, labelDefinition);
        }
        
        return null;
    }
    
    private findLabelDefinition(document: vscode.TextDocument, labelName: string): vscode.Position | null {
        const text = document.getText();
        const lines = text.split('\n');
        
        // Look for label definition (labelName:)
        const labelRegex = new RegExp(`^\\s*(${this.escapeRegex(labelName)})\\s*:`, 'i');
        
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(labelRegex);
            if (match) {
                const character = lines[i].indexOf(match[1]);
                return new vscode.Position(i, character);
            }
        }
        
        // Look for EQU definitions
        const equRegex = new RegExp(`^\\s*(${this.escapeRegex(labelName)})\\s+equ\\b`, 'i');
        
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(equRegex);
            if (match) {
                const character = lines[i].indexOf(match[1]);
                return new vscode.Position(i, character);
            }
        }
        
        return null;
    }
    
    private escapeRegex(str: string): string {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
