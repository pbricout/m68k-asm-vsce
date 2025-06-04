"use strict";
exports.__esModule = true;
exports.M68kDefinitionProvider = void 0;
var vscode = require("vscode");
var fs = require("fs");
var includeUtils_1 = require("./includeUtils");
var logger_1 = require("./logger");
var regexPatterns_1 = require("./regexPatterns");
var fileParser_1 = require("./fileParser");
var M68kDefinitionProvider = /** @class */ (function () {
    function M68kDefinitionProvider() {
    }
    M68kDefinitionProvider.prototype.provideDefinition = function (document, position, token) {
        var _a;
        var wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        var word = document.getText(wordRange);
        var line = document.lineAt(position.line).text;
        // Check if the cursor is on an include statement
        var includeMatch = line.match(regexPatterns_1.M68kRegexPatterns.INCLUDE_STATEMENT);
        if (includeMatch) {
            var includePath = includeMatch[1];
            // Find the actual position of the include path in the line
            var includeKeywordMatch = line.match(/^\s*include\s+/i);
            if (includeKeywordMatch) {
                var includeStartIndex = includeKeywordMatch[0].length + (((_a = line.substring(includeKeywordMatch[0].length).match(/^["']?/)) === null || _a === void 0 ? void 0 : _a[0].length) || 0);
                var includeEndIndex = includeStartIndex + includePath.length;
                var cursorIndex = position.character;
                logger_1.M68kLogger.log("Include detection: line=\"".concat(line.trim(), "\", path=\"").concat(includePath, "\", cursor=").concat(cursorIndex, ", range=[").concat(includeStartIndex, ",").concat(includeEndIndex, "]"));
                if (cursorIndex >= includeStartIndex && cursorIndex <= includeEndIndex) {
                    // Cursor is on the include path, resolve it to a file
                    var context_1 = fileParser_1.M68kFileParser.createParseContext(document);
                    logger_1.M68kLogger.log("Resolving include path: \"".concat(includePath, "\""));
                    var resolved = (0, includeUtils_1.resolveIncludePath)(includePath, context_1.baseDir, context_1.projectRoot, context_1.fallbackPath);
                    if (resolved && fs.existsSync(resolved)) {
                        logger_1.M68kLogger.logSuccess("Include resolved to: ".concat(resolved));
                        return new vscode.Location(vscode.Uri.file(resolved), new vscode.Position(0, 0));
                    }
                    else {
                        logger_1.M68kLogger.logFailure("Include file not found: ".concat(includePath));
                        return null;
                    }
                }
            }
        }
        // If not on an include path, proceed with symbol search
        var context = fileParser_1.M68kFileParser.createParseContext(document);
        var symbolInfo = fileParser_1.M68kFileParser.findSymbolDefinition(context.filePath, word, context);
        if (symbolInfo) {
            logger_1.M68kLogger.logSuccess("Found ".concat(symbolInfo.type, " definition: ").concat(symbolInfo.name, " at line ").concat(symbolInfo.line + 1));
            return new vscode.Location(vscode.Uri.file(symbolInfo.filePath), new vscode.Position(symbolInfo.line, symbolInfo.character));
        }
        logger_1.M68kLogger.log("No definition found for symbol: ".concat(word));
        return null;
    };
    return M68kDefinitionProvider;
}());
exports.M68kDefinitionProvider = M68kDefinitionProvider;
