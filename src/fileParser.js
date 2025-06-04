"use strict";
exports.__esModule = true;
exports.M68kFileParser = void 0;
var vscode = require("vscode");
var fs = require("fs");
var path = require("path");
var regexPatterns_1 = require("./regexPatterns");
var logger_1 = require("./logger");
var includeUtils_1 = require("./includeUtils");
var config_1 = require("./config");
var M68kFileParser = /** @class */ (function () {
    function M68kFileParser() {
    }
    /**
     * Clear all caches
     */
    M68kFileParser.clearCache = function () {
        this.fileCache.clear();
        this.symbolCache.clear();
        logger_1.M68kLogger.log('File and symbol caches cleared');
    };
    /**
     * Clear expired cache entries
     */
    M68kFileParser.cleanExpiredCache = function () {
        var now = Date.now();
        var expiredFiles = [];
        for (var _i = 0, _a = this.fileCache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], filePath = _b[0], entry = _b[1];
            if (now - entry.timestamp > this.CACHE_EXPIRY_MS) {
                expiredFiles.push(filePath);
            }
        }
        for (var _c = 0, expiredFiles_1 = expiredFiles; _c < expiredFiles_1.length; _c++) {
            var filePath = expiredFiles_1[_c];
            this.fileCache["delete"](filePath);
            this.symbolCache["delete"](filePath);
        }
        if (expiredFiles.length > 0) {
            logger_1.M68kLogger.log("Cleaned ".concat(expiredFiles.length, " expired cache entries"));
        }
    };
    /**
     * Get file modification time
     */
    M68kFileParser.getFileModTime = function (filePath) {
        try {
            return fs.statSync(filePath).mtime.getTime();
        }
        catch (_a) {
            return 0;
        }
    };
    /**
     * Check if cache entry is valid
     */
    M68kFileParser.isCacheValid = function (filePath, cacheEntry) {
        var fileModTime = this.getFileModTime(filePath);
        return cacheEntry.timestamp >= fileModTime;
    };
    /**
     * Read and cache file lines
     */
    M68kFileParser.readFileLines = function (filePath) {
        this.cleanExpiredCache();
        var cached = this.fileCache.get(filePath);
        if (cached && this.isCacheValid(filePath, cached)) {
            return cached.content;
        }
        try {
            if (!fs.existsSync(filePath)) {
                logger_1.M68kLogger.warn("File not found: ".concat(filePath));
                return [];
            }
            var content = fs.readFileSync(filePath, 'utf8');
            var lines = content.split(/\r?\n/);
            // Cache the file content
            this.fileCache.set(filePath, {
                content: lines,
                timestamp: Date.now(),
                symbols: []
            });
            return lines;
        }
        catch (error) {
            logger_1.M68kLogger.error("Error reading file: ".concat(filePath), error);
            return [];
        }
    }; /**
     * Create parse context from document
     */
    M68kFileParser.createParseContext = function (document) {
        var lines = [];
        for (var i = 0; i < document.lineCount; i++) {
            lines.push(document.lineAt(i).text);
        }
        var filePath = document.uri.fsPath;
        var baseDir = path.dirname(filePath);
        // Get project root from workspace
        var workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
        var projectRoot = workspaceFolder ? workspaceFolder.uri.fsPath : baseDir;
        // Get fallback path from config
        var config = (0, config_1.getConfig)();
        var fallbackPath = config.includeFallbackPath || './includes';
        return {
            document: document,
            lines: lines,
            filePath: filePath,
            baseDir: baseDir,
            projectRoot: projectRoot,
            fallbackPath: fallbackPath
        };
    };
    /**
     * Parse symbols from lines with caching
     */
    M68kFileParser.parseSymbolsFromLines = function (filePath, lines) {
        var cached = this.symbolCache.get(filePath);
        var fileCache = this.fileCache.get(filePath);
        if (cached && fileCache && this.isCacheValid(filePath, fileCache)) {
            return cached;
        }
        var symbols = [];
        var uri = vscode.Uri.file(filePath);
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = lines[lineIndex].trim();
            if (!line || line.startsWith(';'))
                continue;
            // Label detection
            var labelMatch = line.match(regexPatterns_1.M68kRegexPatterns.LABEL_DEFINITION);
            if (labelMatch) {
                symbols.push({
                    name: labelMatch[1],
                    line: lineIndex,
                    character: line.indexOf(labelMatch[1]),
                    type: 'label',
                    uri: uri,
                    filePath: filePath
                });
                continue;
            }
            // Constant detection (EQU, =)
            var equMatch = line.match(regexPatterns_1.M68kRegexPatterns.EQU_DEFINITION);
            if (equMatch) {
                symbols.push({
                    name: equMatch[1],
                    line: lineIndex,
                    character: line.indexOf(equMatch[1]),
                    type: 'constant',
                    value: equMatch[2],
                    uri: uri,
                    filePath: filePath
                });
                continue;
            }
            // Macro definition
            var macroMatch = line.match(regexPatterns_1.M68kRegexPatterns.MACRO_DEFINITION);
            if (macroMatch) {
                symbols.push({
                    name: macroMatch[1],
                    line: lineIndex,
                    character: line.indexOf(macroMatch[1]),
                    type: 'macro',
                    uri: uri,
                    filePath: filePath
                });
                continue;
            }
            // Variable/storage definition (DS, DC, DCB)
            var varMatch = line.match(/^(\w+)\s+(ds|dc|dcb)\b/i);
            if (varMatch) {
                symbols.push({
                    name: varMatch[1],
                    line: lineIndex,
                    character: line.indexOf(varMatch[1]),
                    type: 'variable',
                    uri: uri,
                    filePath: filePath
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
    }; /**
     * Find symbol definition in context or included files
     */
    M68kFileParser.findSymbolDefinition = function (filePath, symbolName, context) {
        // First search in current document
        var localSymbols = this.parseSymbolsFromLines(context.filePath, context.lines);
        var localMatch = localSymbols.find(function (symbol) { return symbol.name === symbolName; });
        if (localMatch) {
            return localMatch;
        }
        // Search in included files
        var includeFiles = this.findIncludeFiles(context.lines, context.filePath);
        for (var _i = 0, includeFiles_1 = includeFiles; _i < includeFiles_1.length; _i++) {
            var includeFile = includeFiles_1[_i];
            try {
                var includeLines = this.readFileLines(includeFile);
                var includeSymbols = this.parseSymbolsFromLines(includeFile, includeLines);
                var includeMatch = includeSymbols.find(function (symbol) { return symbol.name === symbolName; });
                if (includeMatch) {
                    return includeMatch;
                }
            }
            catch (error) {
                logger_1.M68kLogger.warn("Error processing include file: ".concat(includeFile), error);
            }
        }
        return undefined;
    }; /**
     * Find all references to a symbol
     */
    M68kFileParser.findSymbolReferences = function (symbolName, context, includeDeclaration) {
        var references = [];
        // Search in current document
        this.findReferencesInLines(symbolName, context.lines, context.document.uri, references);
        // Search in included files
        var includeFiles = this.findIncludeFiles(context.lines, context.filePath);
        for (var _i = 0, includeFiles_2 = includeFiles; _i < includeFiles_2.length; _i++) {
            var includeFile = includeFiles_2[_i];
            try {
                var includeLines = this.readFileLines(includeFile);
                var includeUri = vscode.Uri.file(includeFile);
                this.findReferencesInLines(symbolName, includeLines, includeUri, references);
            }
            catch (error) {
                logger_1.M68kLogger.warn("Error searching references in include file: ".concat(includeFile), error);
            }
        }
        return references;
    };
    /**
     * Find references in specific lines
     */
    M68kFileParser.findReferencesInLines = function (symbolName, lines, uri, references) {
        var symbolRegex = new RegExp("\\b".concat(symbolName, "\\b"), 'gi');
        for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            var line = lines[lineIndex];
            var match = void 0;
            while ((match = symbolRegex.exec(line)) !== null) {
                var position = new vscode.Position(lineIndex, match.index);
                var range = new vscode.Range(position, position.translate(0, symbolName.length));
                references.push(new vscode.Location(uri, range));
            }
        }
    };
    /**
     * Find include files referenced in the document
     */
    M68kFileParser.findIncludeFiles = function (lines, currentFilePath) {
        var includeFiles = [];
        var currentDir = path.dirname(currentFilePath);
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            var includeMatch = line.match(regexPatterns_1.M68kRegexPatterns.INCLUDE_STATEMENT);
            if (includeMatch) {
                var includePath = includeMatch[1].replace(/['"]/g, '');
                try {
                    // Get project root and fallback path from config
                    var workspaceFolder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(currentFilePath));
                    var projectRoot = workspaceFolder ? workspaceFolder.uri.fsPath : currentDir;
                    var config = (0, config_1.getConfig)();
                    var fallbackPath = config.includeFallbackPath || './includes';
                    var resolvedPath = (0, includeUtils_1.resolveIncludePath)(includePath, currentDir, projectRoot, fallbackPath);
                    if (resolvedPath && fs.existsSync(resolvedPath)) {
                        includeFiles.push(resolvedPath);
                    }
                }
                catch (error) {
                    logger_1.M68kLogger.warn("Could not resolve include path: ".concat(includePath), error);
                }
            }
        }
        return includeFiles;
    };
    /**
     * Get all symbols from current document and includes
     */
    M68kFileParser.getAllSymbols = function (context) {
        var allSymbols = [];
        // Get symbols from current document
        var localSymbols = this.parseSymbolsFromLines(context.filePath, context.lines);
        allSymbols.push.apply(allSymbols, localSymbols);
        // Get symbols from included files
        var includeFiles = this.findIncludeFiles(context.lines, context.filePath);
        for (var _i = 0, includeFiles_3 = includeFiles; _i < includeFiles_3.length; _i++) {
            var includeFile = includeFiles_3[_i];
            try {
                var includeLines = this.readFileLines(includeFile);
                var includeSymbols = this.parseSymbolsFromLines(includeFile, includeLines);
                allSymbols.push.apply(allSymbols, includeSymbols);
            }
            catch (error) {
                logger_1.M68kLogger.warn("Error getting symbols from include file: ".concat(includeFile), error);
            }
        }
        return allSymbols;
    };
    /**
     * Get cache statistics for debugging
     */
    M68kFileParser.getCacheStats = function () {
        return {
            fileCache: this.fileCache.size,
            symbolCache: this.symbolCache.size
        };
    };
    M68kFileParser.fileCache = new Map();
    M68kFileParser.symbolCache = new Map();
    M68kFileParser.CACHE_EXPIRY_MS = 30000; // 30 seconds
    return M68kFileParser;
}());
exports.M68kFileParser = M68kFileParser;
