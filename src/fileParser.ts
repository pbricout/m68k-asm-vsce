import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { M68kRegexPatterns } from './regexPatterns';
import { M68kLogger } from './logger';
import { resolveIncludePath } from './includeUtils';
import { getConfig } from './config';

export interface ParseContext {
    document: vscode.TextDocument;
    lines: string[];
    filePath: string;
    baseDir: string;
    projectRoot: string;
    fallbackPath: string;
}

export interface SymbolInfo {
    name: string;
    line: number;
    character: number;
    type: 'label' | 'constant' | 'macro' | 'variable';
    value?: string;
    uri: vscode.Uri;
    filePath: string;
}

// Cache interface for performance optimization
interface CacheEntry {
    content: string[];
    timestamp: number;
    symbols: SymbolInfo[];
}

export class M68kFileParser {
    private static fileCache = new Map<string, CacheEntry>();
    private static symbolCache = new Map<string, SymbolInfo[]>();
    private static readonly CACHE_EXPIRY_MS = 30000; // 30 seconds

    /**
     * Clear all caches
     */
    public static clearCache(): void {
        this.fileCache.clear();
        this.symbolCache.clear();
        M68kLogger.log('File and symbol caches cleared');
    }

    /**
     * Clear expired cache entries
     */
    private static cleanExpiredCache(): void {
        const now = Date.now();
        const expiredFiles: string[] = [];
        
        for (const [filePath, entry] of Array.from(this.fileCache.entries())) {
            if (now - entry.timestamp > this.CACHE_EXPIRY_MS) {
                expiredFiles.push(filePath);
            }
        }
        
        for (const filePath of expiredFiles) {
            this.fileCache.delete(filePath);
            this.symbolCache.delete(filePath);
        }
        
        if (expiredFiles.length > 0) {
            M68kLogger.log(`Cleaned ${expiredFiles.length} expired cache entries`);
        }
    }

    /**
     * Get file modification time
     */
    private static getFileModTime(filePath: string): number {
        try {
            return fs.statSync(filePath).mtime.getTime();
        } catch {
            return 0;
        }
    }

    /**
     * Check if cache entry is valid
     */
    private static isCacheValid(filePath: string, cacheEntry: CacheEntry): boolean {
        const fileModTime = this.getFileModTime(filePath);
        return cacheEntry.timestamp >= fileModTime;
    }

    /**
     * Read and cache file lines
     */
    public static readFileLines(filePath: string): string[] {
        this.cleanExpiredCache();
        
        const cached = this.fileCache.get(filePath);
        if (cached && this.isCacheValid(filePath, cached)) {
            return cached.content;
        }

        try {
            if (!fs.existsSync(filePath)) {
                M68kLogger.warn(`File not found: ${filePath}`);
                return [];
            }

            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/);
            
            // Cache the file content
            this.fileCache.set(filePath, {
                content: lines,
                timestamp: Date.now(),
                symbols: []
            });

            return lines;
        } catch (error) {
            M68kLogger.error(`Error reading file: ${filePath}`, error);
            return [];
        }
    }    /**
     * Create parse context from document
     */
    public static createParseContext(document: vscode.TextDocument): ParseContext {
        const lines: string[] = [];
        for (let i = 0; i < document.lineCount; i++) {
            lines.push(document.lineAt(i).text);
        }

        const filePath = document.uri.fsPath;
        const baseDir = path.dirname(filePath);
        
        // Get project root from workspace
        const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        const projectRoot = workspaceFolder ? workspaceFolder.uri.fsPath : baseDir;
        
        // Get fallback path from config
        const config = getConfig();
        const fallbackPath = config.includeFallbackPath || './includes';

        return {
            document,
            lines,
            filePath,
            baseDir,
            projectRoot,
            fallbackPath
        };
    }

    /**
     * Parse symbols from lines with caching
     */
    private static parseSymbolsFromLines(filePath: string, lines: string[]): SymbolInfo[] {
        const cached = this.symbolCache.get(filePath);
        const fileCache = this.fileCache.get(filePath);
        
        if (cached && fileCache && this.isCacheValid(filePath, fileCache)) {
            return cached;
        }

        const symbols: SymbolInfo[] = [];
        const uri = vscode.Uri.file(filePath);

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex].trim();
            if (!line || line.startsWith(';')) continue;

            // Label detection
            const labelMatch = line.match(M68kRegexPatterns.LABEL_DEFINITION);
            if (labelMatch) {                symbols.push({
                    name: labelMatch[1],
                    line: lineIndex,
                    character: line.indexOf(labelMatch[1]),
                    type: 'label',
                    uri,
                    filePath
                });
                continue;
            }

            // Constant detection (EQU, =)
            const equMatch = line.match(M68kRegexPatterns.EQU_DEFINITION);
            if (equMatch) {                symbols.push({
                    name: equMatch[1],
                    line: lineIndex,
                    character: line.indexOf(equMatch[1]),
                    type: 'constant',
                    value: equMatch[2],
                    uri,
                    filePath
                });
                continue;
            }

            // Macro definition
            const macroMatch = line.match(M68kRegexPatterns.MACRO_DEFINITION);
            if (macroMatch) {                symbols.push({
                    name: macroMatch[1],
                    line: lineIndex,
                    character: line.indexOf(macroMatch[1]),
                    type: 'macro',
                    uri,
                    filePath
                });
                continue;
            }

            // Variable/storage definition (DS, DC, DCB)
            const varMatch = line.match(/^(\w+)\s+(ds|dc|dcb)\b/i);
            if (varMatch) {                symbols.push({
                    name: varMatch[1],
                    line: lineIndex,
                    character: line.indexOf(varMatch[1]),
                    type: 'variable',
                    uri,
                    filePath
                });
            }
        }

        // Cache the symbols
        this.symbolCache.set(filePath, symbols);
        
        // Update file cache with symbols
        if (fileCache) {
            fileCache.symbols = symbols;
        }

        return symbols;
    }    /**
     * Find symbol definition in context or included files
     */
    public static findSymbolDefinition(filePath: string, symbolName: string, context: ParseContext): SymbolInfo | undefined {
        // First search in current document
        const localSymbols = this.parseSymbolsFromLines(context.filePath, context.lines);
        const localMatch = localSymbols.find(symbol => symbol.name === symbolName);
        if (localMatch) {
            return localMatch;
        }

        // Search in included files
        const includeFiles = this.findIncludeFiles(context.lines, context.filePath);
        for (const includeFile of includeFiles) {
            try {
                const includeLines = this.readFileLines(includeFile);
                const includeSymbols = this.parseSymbolsFromLines(includeFile, includeLines);
                const includeMatch = includeSymbols.find(symbol => symbol.name === symbolName);
                if (includeMatch) {
                    return includeMatch;
                }
            } catch (error) {
                M68kLogger.warn(`Error processing include file: ${includeFile}`, error);
            }
        }

        return undefined;
    }    /**
     * Find all references to a symbol
     */
    public static findSymbolReferences(symbolName: string, context: ParseContext, includeDeclaration?: boolean): vscode.Location[] {
        const references: vscode.Location[] = [];
        
        // Search in current document
        this.findReferencesInLines(symbolName, context.lines, context.document.uri, references);

        // Search in included files
        const includeFiles = this.findIncludeFiles(context.lines, context.filePath);
        for (const includeFile of includeFiles) {
            try {
                const includeLines = this.readFileLines(includeFile);
                const includeUri = vscode.Uri.file(includeFile);
                this.findReferencesInLines(symbolName, includeLines, includeUri, references);
            } catch (error) {
                M68kLogger.warn(`Error searching references in include file: ${includeFile}`, error);
            }
        }

        return references;
    }

    /**
     * Find references in specific lines
     */
    private static findReferencesInLines(
        symbolName: string, 
        lines: string[], 
        uri: vscode.Uri, 
        references: vscode.Location[]
    ): void {
        const symbolRegex = new RegExp(`\\b${symbolName}\\b`, 'gi');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];
            let match;

            while ((match = symbolRegex.exec(line)) !== null) {
                const position = new vscode.Position(lineIndex, match.index);
                const range = new vscode.Range(position, position.translate(0, symbolName.length));
                references.push(new vscode.Location(uri, range));
            }
        }
    }

    /**
     * Find include files referenced in the document
     */
    public static findIncludeFiles(lines: string[], currentFilePath: string): string[] {
        const includeFiles: string[] = [];
        const currentDir = path.dirname(currentFilePath);        for (const line of lines) {
            const includeMatch = line.match(M68kRegexPatterns.INCLUDE_STATEMENT);
            if (includeMatch) {
                const includePath = includeMatch[1].replace(/['"]/g, '');                try {
                    // Get project root and fallback path from config
                    const workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFilePath));
                    const projectRoot = workspaceFolder ? workspaceFolder.uri.fsPath : currentDir;
                    const config = getConfig();
                    const fallbackPath = config.includeFallbackPath || './includes';
                    
                    const resolvedPath = resolveIncludePath(includePath, currentDir, projectRoot, fallbackPath);
                    if (resolvedPath && fs.existsSync(resolvedPath)) {
                        includeFiles.push(resolvedPath);
                    }
                } catch (error) {
                    M68kLogger.warn(`Could not resolve include path: ${includePath}`, error);
                }
            }
        }

        return includeFiles;
    }

    /**
     * Get all symbols from current document and includes
     */
    public static getAllSymbols(context: ParseContext): SymbolInfo[] {
        const allSymbols: SymbolInfo[] = [];
        
        // Get symbols from current document
        const localSymbols = this.parseSymbolsFromLines(context.filePath, context.lines);
        allSymbols.push(...localSymbols);

        // Get symbols from included files
        const includeFiles = this.findIncludeFiles(context.lines, context.filePath);
        for (const includeFile of includeFiles) {
            try {
                const includeLines = this.readFileLines(includeFile);
                const includeSymbols = this.parseSymbolsFromLines(includeFile, includeLines);
                allSymbols.push(...includeSymbols);
            } catch (error) {
                M68kLogger.warn(`Error getting symbols from include file: ${includeFile}`, error);
            }
        }

        return allSymbols;
    }

    /**
     * Get cache statistics for debugging
     */
    public static getCacheStats(): { fileCache: number; symbolCache: number } {
        return {
            fileCache: this.fileCache.size,
            symbolCache: this.symbolCache.size
        };
    }
}
