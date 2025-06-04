"use strict";
exports.__esModule = true;
exports.M68kRenameProvider = void 0;
var vscode = require("vscode");
var symbolValidator_1 = require("./symbolValidator");
var fileParser_1 = require("./fileParser");
var logger_1 = require("./logger");
var M68kRenameProvider = /** @class */ (function () {
    function M68kRenameProvider() {
    }
    M68kRenameProvider.prototype.prepareRename = function (document, position, token) {
        var wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            throw new Error('Cannot rename this element');
        }
        var word = document.getText(wordRange);
        // Use symbol validator to check if rename is valid
        var validationResult = symbolValidator_1.M68kSymbolValidator.isValidSymbolForRename(word);
        if (validationResult.isValid) {
            return {
                range: wordRange,
                placeholder: word
            };
        }
        throw new Error("Cannot rename \"".concat(word, "\": ").concat(validationResult.reason));
    };
    M68kRenameProvider.prototype.provideRenameEdits = function (document, position, newName, token) {
        var wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }
        var oldName = document.getText(wordRange);
        // Validate new name using symbol validator
        if (!symbolValidator_1.M68kSymbolValidator.isValidSymbolName(newName)) {
            throw new Error('Invalid symbol name format');
        }
        // Use file parser to find all references across files
        var context = fileParser_1.M68kFileParser.createParseContext(document);
        var references = fileParser_1.M68kFileParser.findSymbolReferences(oldName, context, true);
        if (references.length === 0) {
            logger_1.M68kLogger.logFailure("No references found for symbol: ".concat(oldName));
            return null;
        }
        var workspaceEdit = new vscode.WorkspaceEdit();
        // Group edits by file
        var editsByFile = new Map();
        for (var _i = 0, references_1 = references; _i < references_1.length; _i++) {
            var location_1 = references_1[_i];
            var filePath = location_1.uri.fsPath;
            if (!editsByFile.has(filePath)) {
                editsByFile.set(filePath, []);
            }
            var edit = new vscode.TextEdit(location_1.range, newName);
            editsByFile.get(filePath).push(edit);
        }
        // Apply edits to each file
        for (var _a = 0, editsByFile_1 = editsByFile; _a < editsByFile_1.length; _a++) {
            var _b = editsByFile_1[_a], filePath = _b[0], edits = _b[1];
            workspaceEdit.set(vscode.Uri.file(filePath), edits);
        }
        logger_1.M68kLogger.logSuccess("Rename operation will affect ".concat(references.length, " references across ").concat(editsByFile.size, " files"));
        return workspaceEdit;
    };
    return M68kRenameProvider;
}());
exports.M68kRenameProvider = M68kRenameProvider;
