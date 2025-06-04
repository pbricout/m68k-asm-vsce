"use strict";
exports.__esModule = true;
exports.M68kFoldingProvider = void 0;
var vscode = require("vscode");
var regexPatterns_1 = require("./regexPatterns");
/**
 * Provides folding ranges for M68K assembly files
 */
var M68kFoldingProvider = /** @class */ (function () {
    function M68kFoldingProvider() {
    }
    M68kFoldingProvider.prototype.provideFoldingRanges = function (document) {
        var ranges = [];
        var lines = document.getText().split('\n');
        // Track nested structures
        var regionStart = null;
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            // Handle region folding
            if (regexPatterns_1.M68kRegexPatterns.REGION_START.test(line)) {
                regionStart = i;
            }
            else if (regexPatterns_1.M68kRegexPatterns.REGION_END.test(line) && regionStart !== null) {
                ranges.push(new vscode.FoldingRange(regionStart, i, vscode.FoldingRangeKind.Region));
                regionStart = null;
            }
            // Handle macro folding
            if (regexPatterns_1.M68kRegexPatterns.MACRO_START.test(line)) {
                var macroEnd = this.findMatchingEnd(lines, i, regexPatterns_1.M68kRegexPatterns.MACRO_END);
                if (macroEnd !== -1) {
                    ranges.push(new vscode.FoldingRange(i, macroEnd, vscode.FoldingRangeKind.Region));
                }
            }
            // Handle conditional assembly directives
            if (regexPatterns_1.M68kRegexPatterns.CONDITIONAL_START.test(line)) {
                var conditionalEnd = this.findMatchingEnd(lines, i, regexPatterns_1.M68kRegexPatterns.CONDITIONAL_END);
                if (conditionalEnd !== -1) {
                    ranges.push(new vscode.FoldingRange(i, conditionalEnd, vscode.FoldingRangeKind.Region));
                }
            }
            // Handle multi-line comments
            var blockCommentStart = line.indexOf('/*');
            if (blockCommentStart !== -1) {
                var commentEnd = this.findBlockCommentEnd(lines, i, blockCommentStart);
                if (commentEnd !== -1 && commentEnd > i) {
                    ranges.push(new vscode.FoldingRange(i, commentEnd, vscode.FoldingRangeKind.Comment));
                }
            }
        }
        return ranges;
    };
    /**
     * Find the matching end pattern for a start pattern
     */
    M68kFoldingProvider.prototype.findMatchingEnd = function (lines, startIndex, endPattern) {
        for (var j = startIndex + 1; j < lines.length; j++) {
            if (endPattern.test(lines[j].trim())) {
                return j;
            }
        }
        return -1;
    };
    /**
     * Find the end of a block comment that started on the given line
     */
    M68kFoldingProvider.prototype.findBlockCommentEnd = function (lines, startLine, startColumn) {
        // Check if the comment ends on the same line
        var startLineText = lines[startLine];
        var endIndex = startLineText.indexOf('*/', startColumn + 2);
        if (endIndex !== -1) {
            return startLine;
        }
        // Search subsequent lines
        for (var j = startLine + 1; j < lines.length; j++) {
            if (lines[j].indexOf('*/') !== -1) {
                return j;
            }
        }
        return -1;
    };
    return M68kFoldingProvider;
}());
exports.M68kFoldingProvider = M68kFoldingProvider;
