// Test script to verify include path hover functionality
import * as vscode from 'vscode';
import * as path from 'path';

export async function testIncludePathHover() {
    console.log('Testing include path hover functionality...');
    
    // Create a test document
    const testContent = `
; Test include directives
    include path\\file.i
    incbin  path\\file.bin
    include "quoted/path/file.inc"
    incbin  'single-quoted/path/data.bin'
    `;
    
    const document = await vscode.workspace.openTextDocument({
        content: testContent,
        language: 'm68k-asm'
    });
    
    // Test positions for hover
    const testCases = [
        { line: 2, character: 12, expected: 'path\\file.i' },      // include path\file.i
        { line: 3, character: 12, expected: 'path\\file.bin' },    // incbin path\file.bin
        { line: 4, character: 14, expected: 'quoted/path/file.inc' }, // "quoted/path/file.inc"
        { line: 5, character: 14, expected: 'single-quoted/path/data.bin' } // 'single-quoted/path/data.bin'
    ];
    
    console.log('Test cases prepared. Manual testing required:');
    testCases.forEach((testCase, index) => {
        console.log(`  ${index + 1}. Line ${testCase.line + 1}, Char ${testCase.character + 1}: ${testCase.expected}`);
    });
    
    console.log('\\nTo test manually:');
    console.log('1. Open the test file');
    console.log('2. Hover over the path portions in the include/incbin lines');
    console.log('3. Verify that hover shows resolved path information');
    
    return document;
}

// Export for use in test runner
export { testIncludePathHover };
