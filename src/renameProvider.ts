import * as vscode from 'vscode';
import { M68kSymbolValidator } from './symbolValidator';
import { M68kFileParser } from './fileParser';
import { M68kLogger } from './logger';

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
        
        // Use symbol validator to check if rename is valid
        const validationResult = M68kSymbolValidator.isValidSymbolForRename(word);
        if (validationResult.isValid) {
            return {
                range: wordRange,
                placeholder: word
            };
        }
        
        throw new Error(`Cannot rename "${word}": ${validationResult.reason}`);
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
        
        // Validate new name using symbol validator
        if (!M68kSymbolValidator.isValidSymbolName(newName)) {
            throw new Error('Invalid symbol name format');
        }
        
        // Use file parser to find all references across files
        const context = M68kFileParser.createParseContext(document);
        const references = M68kFileParser.findSymbolReferences(oldName, context, true);
        
        if (references.length === 0) {
            M68kLogger.logFailure(`No references found for symbol: ${oldName}`);
            return null;
        }
        
        const workspaceEdit = new vscode.WorkspaceEdit();
        
        // Group edits by file
        const editsByFile = new Map<string, vscode.TextEdit[]>();
        
        for (const location of references) {
            const filePath = location.uri.fsPath;
            if (!editsByFile.has(filePath)) {
                editsByFile.set(filePath, []);
            }
            
            const edit = new vscode.TextEdit(location.range, newName);
            editsByFile.get(filePath)!.push(edit);
        }
        
        // Apply edits to each file
        for (const [filePath, edits] of Array.from(editsByFile)) {
            workspaceEdit.set(vscode.Uri.file(filePath), edits);
        }
        
        M68kLogger.logSuccess(`Rename operation will affect ${references.length} references across ${editsByFile.size} files`);
        return workspaceEdit;
    }}