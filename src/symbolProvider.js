"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.M68kDocumentSymbolProvider = void 0;
var vscode = require("vscode");
var path = require("path");
var fs = require("fs");
var includeUtils_1 = require("./includeUtils");
var fileParser_1 = require("./fileParser");
var regexPatterns_1 = require("./regexPatterns");
var logger_1 = require("./logger");
var M68kDocumentSymbolProvider = /** @class */ (function () {
    function M68kDocumentSymbolProvider() {
    }
    M68kDocumentSymbolProvider.prototype.provideDocumentSymbols = function (document, token) {
        return __awaiter(this, void 0, void 0, function () {
            var symbols, context, parseFile, allSymbols;
            return __generator(this, function (_a) {
                symbols = [];
                context = fileParser_1.M68kFileParser.createParseContext(document);
                parseFile = function (filePath, baseDir, visited) {
                    var _a;
                    if (visited === void 0) { visited = new Set(); }
                    if (visited.has(filePath))
                        return [];
                    visited.add(filePath);
                    var fileText;
                    try {
                        fileText = fs.readFileSync(filePath, 'utf8');
                    }
                    catch (error) {
                        logger_1.M68kLogger.logFailure("Failed to read file: ".concat(filePath));
                        return [];
                    }
                    var fileLines = fileText.split('\n');
                    var fileSymbols = [];
                    for (var i = 0; i < fileLines.length; i++) {
                        var line = fileLines[i];
                        // Labels using regex patterns
                        var labelMatch = line.match(regexPatterns_1.M68kRegexPatterns.LABEL_DEFINITION);
                        if (labelMatch) {
                            var labelName = labelMatch[1];
                            var labelStart = line.indexOf(labelName);
                            var range = new vscode.Range(new vscode.Position(i, labelStart), new vscode.Position(i, labelStart + labelName.length));
                            var symbol = new vscode.DocumentSymbol(labelName, 'Label', vscode.SymbolKind.Function, range, range);
                            fileSymbols.push(symbol);
                        }
                        // EQU definitions using regex patterns
                        var equMatch = line.match(regexPatterns_1.M68kRegexPatterns.EQU_DEFINITION);
                        if (equMatch) {
                            var symbolName = equMatch[1];
                            var symbolValue = equMatch[2].split(';')[0].trim();
                            var symbolStart = line.indexOf(symbolName);
                            var range = new vscode.Range(new vscode.Position(i, symbolStart), new vscode.Position(i, symbolStart + symbolName.length));
                            var symbol = new vscode.DocumentSymbol("".concat(symbolName, " = ").concat(symbolValue), 'Constant', vscode.SymbolKind.Constant, range, range);
                            fileSymbols.push(symbol);
                        }
                        // Macro definitions using regex patterns
                        var macroMatch = line.match(regexPatterns_1.M68kRegexPatterns.MACRO_DEFINITION);
                        if (macroMatch) {
                            var macroName = macroMatch[1];
                            var macroStart = line.indexOf(macroName);
                            var macroEnd = i;
                            // Find matching ENDM
                            for (var j = i + 1; j < fileLines.length; j++) {
                                if (regexPatterns_1.M68kRegexPatterns.MACRO_END.test(fileLines[j].trim())) {
                                    macroEnd = j;
                                    break;
                                }
                            }
                            var range = new vscode.Range(new vscode.Position(i, macroStart), new vscode.Position(macroEnd, ((_a = fileLines[macroEnd]) === null || _a === void 0 ? void 0 : _a.length) || 0));
                            var selectionRange = new vscode.Range(new vscode.Position(i, macroStart), new vscode.Position(i, macroStart + macroName.length));
                            var symbol = new vscode.DocumentSymbol(macroName, 'Macro', vscode.SymbolKind.Function, range, selectionRange);
                            fileSymbols.push(symbol);
                        }
                        // Section definitions using regex patterns
                        var sectionMatch = line.match(regexPatterns_1.M68kRegexPatterns.SECTION_DEFINITION);
                        if (sectionMatch) {
                            var sectionName = sectionMatch[1];
                            var sectionStart = line.indexOf('section');
                            var range = new vscode.Range(new vscode.Position(i, sectionStart), new vscode.Position(i, line.length));
                            var symbol = new vscode.DocumentSymbol(sectionName, 'Section', vscode.SymbolKind.Namespace, range, range);
                            fileSymbols.push(symbol);
                        }
                        // Include statements - process included files recursively
                        var includeMatch = line.match(regexPatterns_1.M68kRegexPatterns.INCLUDE_STATEMENT);
                        if (includeMatch) {
                            var includePath = includeMatch[1];
                            var resolved = (0, includeUtils_1.resolveIncludePath)(includePath, baseDir, context.projectRoot, context.fallbackPath);
                            if (resolved) {
                                var includeSymbols = parseFile(resolved, path.dirname(resolved), visited);
                                fileSymbols.push.apply(fileSymbols, includeSymbols);
                            }
                        }
                    }
                    return fileSymbols;
                };
                allSymbols = parseFile(context.filePath, context.baseDir);
                symbols.push.apply(symbols, allSymbols);
                logger_1.M68kLogger.logSuccess("Found ".concat(symbols.length, " symbols in document"));
                return [2 /*return*/, symbols];
            });
        });
    };
    return M68kDocumentSymbolProvider;
}());
exports.M68kDocumentSymbolProvider = M68kDocumentSymbolProvider;
