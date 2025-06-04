"use strict";
exports.__esModule = true;
exports.M68kReferenceProvider = void 0;
var fileParser_1 = require("./fileParser");
var M68kReferenceProvider = /** @class */ (function () {
    function M68kReferenceProvider() {
    }
    M68kReferenceProvider.prototype.provideReferences = function (document, position, context, token) {
        var wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return [];
        }
        var word = document.getText(wordRange);
        var parseContext = fileParser_1.M68kFileParser.createParseContext(document);
        return fileParser_1.M68kFileParser.findSymbolReferences(word, parseContext, context.includeDeclaration);
    };
    return M68kReferenceProvider;
}());
exports.M68kReferenceProvider = M68kReferenceProvider;
