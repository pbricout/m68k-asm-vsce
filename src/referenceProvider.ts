import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';
import { M68kFileParser } from './fileParser';

export class M68kReferenceProvider implements vscode.ReferenceProvider {    provideReferences(
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
        const parseContext = M68kFileParser.createParseContext(document);
        
        return M68kFileParser.findSymbolReferencesWithScoping(word, parseContext, position, context.includeDeclaration);
    }
}
