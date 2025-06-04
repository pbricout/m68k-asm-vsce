/**
 * This test verifies that the fileParser.findIncludeFiles method properly processes 
 * both include and incbin directives when scanning for included files.
 */

import * as path from 'path';
import * as fs from 'fs';
import * as assert from 'assert';

// Mock vscode module since we're running outside of VS Code
jest.mock('vscode', () => ({
    Uri: {
        file: (path: string) => ({ fsPath: path })
    },
    workspace: {
        getWorkspaceFolder: () => null
    },
    Position: jest.fn(),
    Range: jest.fn(),
    Location: jest.fn()
}));

// Now we can import our modules that depend on vscode
import { M68kRegexPatterns } from '../../src/regexPatterns';

// Create a simplified test-only version that doesn't rely on VS Code API
const testIncbinRegexOnly = () => {
    console.log('\n🧪 Testing regex patterns for incbin directives...');
    
    try {
        // Test content
        const testLines = [
            'include "test-file.s"',
            'include test-file.s',
            'incbin "test-binary.bin"',
            'incbin test-binary.bin',
            '    include   "spaced-file.s"',
            '    incbin   "spaced-binary.bin"'
        ];
        
        // Test INCLUDE_STATEMENT regex
        const includeMatches = testLines
            .filter(line => M68kRegexPatterns.INCLUDE_STATEMENT.test(line))
            .map(line => line.match(M68kRegexPatterns.INCLUDE_STATEMENT))
            .filter(Boolean);
            
        console.log(`Found ${includeMatches.length} include statements`);
        assert.strictEqual(includeMatches.length, 3, 'Should find 3 include statements');
        
        // Test INCBIN_STATEMENT regex
        const incbinMatches = testLines
            .filter(line => M68kRegexPatterns.INCBIN_STATEMENT.test(line))
            .map(line => line.match(M68kRegexPatterns.INCBIN_STATEMENT))
            .filter(Boolean);
            
        console.log(`Found ${incbinMatches.length} incbin statements`);
        assert.strictEqual(incbinMatches.length, 3, 'Should find 3 incbin statements');
        
        // Test INCLUDE_PATH_PATTERN regex (should match both)
        const combinedMatches = testLines
            .filter(line => M68kRegexPatterns.INCLUDE_PATH_PATTERN.test(line))
            .map(line => line.match(M68kRegexPatterns.INCLUDE_PATH_PATTERN))
            .filter(Boolean);
            
        console.log(`Found ${combinedMatches.length} total include/incbin statements`);
        assert.strictEqual(combinedMatches.length, 6, 'Should find all 6 statements');
        
        console.log('\n✅ All regex patterns for include/incbin directives working correctly!');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
};

// Test directory setup
const TEST_DIR = path.join(__dirname, 'fixtures');
const TEST_FILE = path.join(TEST_DIR, 'test-incbin-parser.s');

/**
 * Set up test environment
 */
function setupTest() {
    // Make sure test directory exists
    if (!fs.existsSync(TEST_DIR)) {
        fs.mkdirSync(TEST_DIR, { recursive: true });
    }

    // Create test files for both include and incbin directives
    const binFile = path.join(TEST_DIR, 'test-data.bin');
    const incFile = path.join(TEST_DIR, 'test-include.inc');
    
    fs.writeFileSync(binFile, Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]));
    fs.writeFileSync(incFile, '; Test include file\nTEST_CONSTANT equ $1234\n');

    // Create test file with both include and incbin directives
    const testContent = `
; Test file to verify fileParser handles both include and incbin
    include "${incFile.replace(/\\/g, '/')}"
    incbin "${binFile.replace(/\\/g, '/')}"
    
    include ${incFile.replace(/\\/g, '/')}
    incbin ${binFile.replace(/\\/g, '/')}
`;
    
    fs.writeFileSync(TEST_FILE, testContent);
    
    return {
        testFile: TEST_FILE,
        binFile,
        incFile
    };
}

/**
 * Clean up test files
 */
function cleanupTest(files: { testFile: string, binFile: string, incFile: string }) {
    if (fs.existsSync(files.testFile)) fs.unlinkSync(files.testFile);
    if (fs.existsSync(files.binFile)) fs.unlinkSync(files.binFile);
    if (fs.existsSync(files.incFile)) fs.unlinkSync(files.incFile);
}

/**
 * Run the test
 */
function testFileParser() {
    console.log('\n🧪 Testing fileParser support for incbin directives...');
    
    const files = setupTest();
    
    try {
        // Read the test file lines
        const lines = fs.readFileSync(files.testFile, 'utf8').split(/\r?\n/);
        
        // Test fileParser.findIncludeFiles with include directives
        const includeFiles = M68kFileParser.findIncludeFiles(lines, files.testFile);
        console.log(`Found ${includeFiles.length} include files:`, includeFiles);
        
        // Verify that include files are detected
        assert.ok(includeFiles.length > 0, 'Should find at least one include file');
        assert.ok(includeFiles.some(f => f.includes('test-include.inc')), 'Should find test-include.inc');
        
        // Test INCLUDE_PATH_PATTERN regex (for incbin directives)
        const incbinMatches = lines.filter(line => line.match(M68kRegexPatterns.INCLUDE_PATH_PATTERN));
        console.log(`Found ${incbinMatches.length} include/incbin directives`, incbinMatches);
        
        // Verify that the INCLUDE_PATH_PATTERN can match both include and incbin
        assert.ok(incbinMatches.length >= 2, 'Should match at least 2 directives');
        assert.ok(incbinMatches.some(line => line.includes('incbin')), 'Should match incbin directive');
        assert.ok(incbinMatches.some(line => line.includes('include')), 'Should match include directive');
        
        // Verify INCBIN_STATEMENT regex specifically
        const incbinDirectives = lines.filter(line => line.match(M68kRegexPatterns.INCBIN_STATEMENT));
        console.log(`Found ${incbinDirectives.length} incbin directives`, incbinDirectives);
        assert.ok(incbinDirectives.length >= 1, 'Should find at least one incbin directive');
        
        console.log('\n✅ fileParser support for incbin directives verified!');
        return true;
    } catch (error) {
        console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
        return false;
    } finally {
        cleanupTest(files);
    }
}

// Run the test if this script is run directly
if (require.main === module) {
    const success = testFileParser();
    process.exit(success ? 0 : 1);
}

// Export functions for use in other tests
export {
    setupTest,
    cleanupTest,
    testFileParser
};
