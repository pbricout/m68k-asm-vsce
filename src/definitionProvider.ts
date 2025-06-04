import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';
import { M68kLogger } from './logger';

export class M68kDefinitionProvider implements vscode.DefinitionProvider {    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        const word = document.getText(wordRange);        const line = document.lineAt(position.line).text;
        
        // Check if the cursor is on an include statement
        const includeMatch = line.match(/^\s*include\s+["']?([^"'\s]+)["']?/i);
        if (includeMatch) {
            const includePath = includeMatch[1];
            // Find the actual position of the include path in the line
            const includeKeywordMatch = line.match(/^\s*include\s+/i);
            if (includeKeywordMatch) {
                const includeStartIndex = includeKeywordMatch[0].length + (line.substring(includeKeywordMatch[0].length).match(/^["']?/)?.[0].length || 0);
                const includeEndIndex = includeStartIndex + includePath.length;
                const cursorIndex = position.character;
                
                M68kLogger.log(`Include detection: line="${line.trim()}", path="${includePath}", cursor=${cursorIndex}, range=[${includeStartIndex},${includeEndIndex}]`);
                
                if (cursorIndex >= includeStartIndex && cursorIndex <= includeEndIndex) {
                    // Cursor is on the include path, resolve it to a file
                    const mainFilePath = document.uri.fsPath;
                    const baseDir = path.dirname(mainFilePath);
                    const projectRoot = getProjectRoot(document);
                    const fallbackPath = getIncludeFallbackPath(projectRoot);
                    
                    M68kLogger.log(`Resolving include path: "${includePath}"`);
                    const resolved = resolveIncludePath(includePath, baseDir, projectRoot, fallbackPath);
                    if (resolved && fs.existsSync(resolved)) {
                        M68kLogger.logSuccess(`Include resolved to: ${resolved}`);
                        return new vscode.Location(vscode.Uri.file(resolved), new vscode.Position(0, 0));
                    } else {
                        M68kLogger.logFailure(`Include file not found: ${includePath}`);
                        return null;
                    }
                }
            }
        }
          // If not on an include path, proceed with label search
        const mainFilePath = document.uri.fsPath;
        const baseDir = path.dirname(mainFilePath);
        const projectRoot = getProjectRoot(document);
        const fallbackPath = getIncludeFallbackPath(projectRoot);
        
        // Recursively search for label/constant definition in main and included files
        const findLabelDefinitionRecursive = (filePath: string, baseDir: string, labelName: string, visited = new Set<string>()): vscode.Location | null => {
            if (visited.has(filePath)) return null;
            visited.add(filePath);
            
            M68kLogger.log(`Searching for label "${labelName}" in: ${filePath}`);
            
            let text: string;
            try {
                text = fs.readFileSync(filePath, 'utf8');
            } catch (error) {
                M68kLogger.warn(`Could not read file: ${filePath}`, error);
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
