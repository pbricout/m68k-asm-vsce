import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { resolveIncludePath, getProjectRoot, getIncludeFallbackPath } from './includeUtils';
import { M68kLogger } from './logger';
import { M68kRegexPatterns } from './regexPatterns';
import { M68kFileParser } from './fileParser';

export class M68kDefinitionProvider implements vscode.DefinitionProvider {
    /**
     * Check if a word is a reserved M68K instruction or register
     */
    private isReservedWord(word: string): boolean {
        return M68kRegexPatterns.isReservedWord(word);
    }

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
        
        // Don't provide definitions for M68K instructions and registers
        if (this.isReservedWord(word)) {
            M68kLogger.log(`Skipping definition for reserved word: ${word.toUpperCase()}`);
            return null;
        }
          const line = document.lineAt(position.line).text;
        
        // Check if the cursor is on an include or incbin statement
        const includeMatch = line.match(M68kRegexPatterns.INCLUDE_PATH_PATTERN);
        if (includeMatch) {
            // Extract the path - could be in group 2 (quoted) or group 3 (unquoted)
            const includePath = includeMatch[2] || includeMatch[3];
            
            // Find the actual position of the include path in the line
            const includeStartIndex = line.indexOf(includePath);
            const includeEndIndex = includeStartIndex + includePath.length;
            const cursorIndex = position.character;
            
            M68kLogger.log(`Include/incbin detection: line="${line.trim()}", path="${includePath}", cursor=${cursorIndex}, range=[${includeStartIndex},${includeEndIndex}]`);
            
            if (cursorIndex >= includeStartIndex && cursorIndex <= includeEndIndex) {
                // Cursor is on the include path, resolve it to a file
                const context = M68kFileParser.createParseContext(document);
                
                M68kLogger.log(`Resolving include/incbin path: "${includePath}"`);
                const resolved = resolveIncludePath(includePath, context.baseDir, context.projectRoot, context.fallbackPath);
                if (resolved && fs.existsSync(resolved)) {
                    M68kLogger.logSuccess(`Include/incbin resolved to: ${resolved}`);
                    return new vscode.Location(vscode.Uri.file(resolved), new vscode.Position(0, 0));
                } else {
                    M68kLogger.logFailure(`Include/incbin file not found: ${includePath}`);
                    return null;
                }
            }
        }
          // If not on an include path, proceed with symbol search
        const context = M68kFileParser.createParseContext(document);
        const symbolInfo = M68kFileParser.findSymbolDefinitionWithScoping(word, context, position);
        
        if (symbolInfo) {
            M68kLogger.logSuccess(`Found ${symbolInfo.type} definition: ${symbolInfo.name} at line ${symbolInfo.line + 1}`);
            return new vscode.Location(
                vscode.Uri.file(symbolInfo.filePath), 
                new vscode.Position(symbolInfo.line, symbolInfo.character)
            );
        }
        
        M68kLogger.log(`No definition found for symbol: ${word}`);
        return null;
    }
}
