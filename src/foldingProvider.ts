import * as vscode from 'vscode';
import { M68kRegexPatterns } from './regexPatterns';

/**
 * Provides folding ranges for M68K assembly files
 */
export class M68kFoldingProvider implements vscode.FoldingRangeProvider {
    
    provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const lines = document.getText().split('\n');
        
        // Track nested structures
        let regionStart: number | null = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Handle region folding
            if (M68kRegexPatterns.REGION_START.test(line)) {
                regionStart = i;
            } else if (M68kRegexPatterns.REGION_END.test(line) && regionStart !== null) {
                ranges.push(new vscode.FoldingRange(regionStart, i, vscode.FoldingRangeKind.Region));
                regionStart = null;
            }
            
            // Handle macro folding
            if (M68kRegexPatterns.MACRO_START.test(line)) {
                const macroEnd = this.findMatchingEnd(lines, i, M68kRegexPatterns.MACRO_END);
                if (macroEnd !== -1) {
                    ranges.push(new vscode.FoldingRange(i, macroEnd, vscode.FoldingRangeKind.Region));
                }
            }
            
            // Handle conditional assembly directives
            if (M68kRegexPatterns.CONDITIONAL_START.test(line)) {
                const conditionalEnd = this.findMatchingEnd(lines, i, M68kRegexPatterns.CONDITIONAL_END);
                if (conditionalEnd !== -1) {
                    ranges.push(new vscode.FoldingRange(i, conditionalEnd, vscode.FoldingRangeKind.Region));
                }
            }
            
            // Handle multi-line comments
            const blockCommentStart = line.indexOf('/*');
            if (blockCommentStart !== -1) {
                const commentEnd = this.findBlockCommentEnd(lines, i, blockCommentStart);
                if (commentEnd !== -1 && commentEnd > i) {
                    ranges.push(new vscode.FoldingRange(i, commentEnd, vscode.FoldingRangeKind.Comment));
                }
            }
        }
        
        return ranges;
    }
    
    /**
     * Find the matching end pattern for a start pattern
     */
    private findMatchingEnd(lines: string[], startIndex: number, endPattern: RegExp): number {
        for (let j = startIndex + 1; j < lines.length; j++) {
            if (endPattern.test(lines[j].trim())) {
                return j;
            }
        }
        return -1;
    }
    
    /**
     * Find the end of a block comment that started on the given line
     */
    private findBlockCommentEnd(lines: string[], startLine: number, startColumn: number): number {
        // Check if the comment ends on the same line
        const startLineText = lines[startLine];
        const endIndex = startLineText.indexOf('*/', startColumn + 2);
        if (endIndex !== -1) {
            return startLine;
        }
        
        // Search subsequent lines
        for (let j = startLine + 1; j < lines.length; j++) {
            if (lines[j].indexOf('*/') !== -1) {
                return j;
            }
        }
        
        return -1;
    }
}
