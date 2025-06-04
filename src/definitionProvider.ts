import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath } from './includeUtils';

function getProjectRoot(document: vscode.TextDocument): string {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) return path.dirname(document.uri.fsPath);
    const containing = wsFolders.find(f => document.uri.fsPath.startsWith(f.uri.fsPath));
    return containing ? containing.uri.fsPath : wsFolders[0].uri.fsPath;
}

function getIncludeFallbackPath(projectRoot: string): string {
    const configPath = path.join(projectRoot, 'm68kasmconfig.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.includeFallbackPath) {
                // If absolute, use as-is; if relative, resolve from project root
                return path.isAbsolute(config.includeFallbackPath)
                    ? config.includeFallbackPath
                    : path.resolve(projectRoot, config.includeFallbackPath);
            }
        } catch {}
    }
    return projectRoot;
}

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
        const mainFilePath = document.uri.fsPath;
        const baseDir = path.dirname(mainFilePath);
        const projectRoot = getProjectRoot(document);
        const fallbackPath = getIncludeFallbackPath(projectRoot);
        // Recursively search for label/constant definition in main and included files
        const findLabelDefinitionRecursive = (filePath: string, baseDir: string, labelName: string, visited = new Set<string>()): vscode.Location | null => {
            if (visited.has(filePath)) return null;
            visited.add(filePath);
            let text: string;
            try {
                text = fs.readFileSync(filePath, 'utf8');
            } catch {
                return null;
            }
            const lines = text.split('\n');
            const labelRegex = new RegExp(`^\\s*(${labelName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})\\s*:`, 'i');
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(labelRegex);
                if (match) {
                    const character = lines[i].indexOf(match[1]);
                    return new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(i, character));
                }
            }
            const equRegex = new RegExp(`^\\s*(${labelName.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})\\s+equ\\b`, 'i');
            for (let i = 0; i < lines.length; i++) {
                const match = lines[i].match(equRegex);
                if (match) {
                    const character = lines[i].indexOf(match[1]);
                    return new vscode.Location(vscode.Uri.file(filePath), new vscode.Position(i, character));
                }
            }
            // Scan for includes
            for (let i = 0; i < lines.length; i++) {
                const includeMatch = lines[i].match(/^\s*include\s+["']?([^"'\s]+)["']?/i);
                if (includeMatch) {
                    const includePath = includeMatch[1];
                    const resolved = resolveIncludePath(includePath, baseDir, projectRoot, fallbackPath);
                    if (resolved) {
                        const found = findLabelDefinitionRecursive(resolved, path.dirname(resolved), labelName, visited);
                        if (found) return found;
                    }
                }
            }
            return null;
        };
        return findLabelDefinitionRecursive(mainFilePath, baseDir, word);
    }
}
