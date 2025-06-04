#!/usr/bin/env node

/**
 * Test script to verify local label scoping implementation
 */

// Add the project root to the module path so we can import from src
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

// Import the compiled modules
const { M68kFileParser } = require('../out/src/fileParser');
const { createTestParseContext, parseTestFile } = require('../out/src/testUtils');
const fs = require('fs');

console.log('🔍 Testing Local Label Scoping Implementation');
console.log('');

const testFilePath = path.join(projectRoot, 'test/test-files/local-label-scoping-test.s');

if (!fs.existsSync(testFilePath)) {
    console.log('❌ Test file not found:', testFilePath);
    process.exit(1);
}

async function testLocalLabelScoping() {
    try {
        // Create a mock document for the test file
        const lines = fs.readFileSync(testFilePath, 'utf8').split('\n');
        const mockDocument = {
            uri: { fsPath: testFilePath },
            getText: () => lines.join('\n'),
            lineAt: (line) => ({ text: lines[line] || '' }),
            lineCount: lines.length
        };

        console.log('📋 Test file loaded:', path.basename(testFilePath));
        console.log('📄 Lines:', lines.length);
        console.log('');

        // Parse symbols
        const context = M68kFileParser.createParseContext(mockDocument);
        const symbols = M68kFileParser.parseSymbolsFromLines(testFilePath, lines);

        console.log('🔍 Found symbols:');
        symbols.forEach(symbol => {
            const scope = symbol.isLocal && symbol.globalScope ? ` (scope: ${symbol.globalScope})` : '';
            const type = symbol.isLocal ? 'Local' : 'Global';
            console.log(`  ${type}: ${symbol.name} at line ${symbol.line + 1}${scope}`);
        });
        console.log('');

        // Test 1: Find .loop in start scope from line 7 (inside start scope)
        console.log('🧪 Test 1: Find .loop from start scope (line 7)');
        const startScopePosition = { line: 6, character: 10 }; // Inside start scope
        const loopInStart = M68kFileParser.findSymbolDefinitionWithScoping('.loop', context, startScopePosition);
        if (loopInStart && loopInStart.globalScope === 'start') {
            console.log('✅ Found .loop in start scope at line', loopInStart.line + 1);
        } else {
            console.log('❌ Failed to find .loop in start scope');
        }

        // Test 2: Find .loop in subroutine scope from line 15 (inside subroutine scope)
        console.log('🧪 Test 2: Find .loop from subroutine scope (line 15)');
        const subroutineScopePosition = { line: 14, character: 10 }; // Inside subroutine scope
        const loopInSubroutine = M68kFileParser.findSymbolDefinitionWithScoping('.loop', context, subroutineScopePosition);
        if (loopInSubroutine && loopInSubroutine.globalScope === 'subroutine') {
            console.log('✅ Found .loop in subroutine scope at line', loopInSubroutine.line + 1);
        } else {
            console.log('❌ Failed to find .loop in subroutine scope');
        }

        // Test 3: Try to find .loop from test_invalid_scope (should fail)
        console.log('🧪 Test 3: Try to find .loop from test_invalid_scope (should fail)');
        const invalidScopePosition = { line: 28, character: 10 }; // Inside test_invalid_scope
        const loopInInvalidScope = M68kFileParser.findSymbolDefinitionWithScoping('.loop', context, invalidScopePosition);
        if (!loopInInvalidScope) {
            console.log('✅ Correctly failed to find .loop in invalid scope');
        } else {
            console.log('❌ Incorrectly found .loop in invalid scope:', loopInInvalidScope.globalScope);
        }

        // Test 4: Find global label from anywhere
        console.log('🧪 Test 4: Find global label "start" from any scope');
        const globalLabelPosition = { line: 28, character: 10 }; // From test_invalid_scope
        const startLabel = M68kFileParser.findSymbolDefinitionWithScoping('start', context, globalLabelPosition);
        if (startLabel && !startLabel.isLocal) {
            console.log('✅ Found global label "start" at line', startLabel.line + 1);
        } else {
            console.log('❌ Failed to find global label "start"');
        }

        console.log('');
        console.log('🎯 Local Label Scoping Test Complete!');

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        process.exit(1);
    }
}

// Run the test
testLocalLabelScoping();
