import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';

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
        const mainFilePath = document.uri.fsPath;
        const baseDir = path.dirname(mainFilePath);
        const projectRoot = getProjectRoot(document);
        const fallbackPath = getIncludeFallbackPath(projectRoot);
        // Recursively search for references and definitions in main and included files
        const findAllReferencesRecursive = (filePath: string, baseDir: string, symbolName: string, includeDeclaration: boolean, visited = new Set<string>()): vscode.Location[] => {
            if (visited.has(filePath)) return [];
            visited.add(filePath);
            let text: string;
            try {
                text = fs.readFileSync(filePath, 'utf8');
            } catch {
                return [];
            }
            const lines = text.split('\n');
            const locations: vscode.Location[] = [];
            const escapedSymbol = symbolName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Label definition
                const labelDefMatch = line.match(new RegExp(`^\\s*(${escapedSymbol})\\s*:`, 'i'));
                if (labelDefMatch && includeDeclaration) {
                    const character = line.indexOf(labelDefMatch[1]);
                    locations.push(new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(i, character)));
                }
                // EQU definition
                const equDefMatch = line.match(new RegExp(`^\\s*(${escapedSymbol})\\s+equ\\b`, 'i'));
                if (equDefMatch && includeDeclaration) {
                    const character = line.indexOf(equDefMatch[1]);
                    locations.push(new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(i, character)));
                }
                // References
                const referenceRegex = new RegExp(`\\b(${escapedSymbol})\\b`, 'gi');
                let match;
                while ((match = referenceRegex.exec(line)) !== null) {
                    const beforeMatch = line.substring(0, match.index).trim();
                    const afterMatch = line.substring(match.index + match[0].length).trim();
                    if (beforeMatch === '' && afterMatch.startsWith(':')) continue;
                    if (beforeMatch === '' && afterMatch.toLowerCase().startsWith('equ')) continue;
                    const range = new vscode.Range(
                        new vscode.Position(i, match.index),
                        new vscode.Position(i, match.index + match[0].length)
                    );
                    locations.push(new vscode.Location(vscode.Uri.file(filePath), range));
                }
                // INCLUDE
                const includeMatch = line.match(/^\s*include\s+["']?([^"'\s]+)["']?/i);
                if (includeMatch) {
                    const includePath = includeMatch[1];
                    const resolved = resolveIncludePath(includePath, baseDir, projectRoot, fallbackPath);
                    if (resolved) {
                        locations.push(...findAllReferencesRecursive(resolved, path.dirname(resolved), symbolName, includeDeclaration, visited));
                    }
                }
            }
            return locations;
        };
        return findAllReferencesRecursive(mainFilePath, baseDir, word, context.includeDeclaration);
    }
}
