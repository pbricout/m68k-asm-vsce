#!/usr/bin/env node

/**
 * Simple test to verify local label scoping without VS Code dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Local Label Scoping (Core Logic)');
console.log('');

const testFilePath = path.join(__dirname, 'test-files/local-label-scoping-test.s');

if (!fs.existsSync(testFilePath)) {
    console.log('❌ Test file not found:', testFilePath);
    process.exit(1);
}

// Test the core regex patterns and logic without importing compiled modules
function testRegexPatterns() {
    console.log('🧪 Testing Regex Patterns');
    
    // Test lines from our test file
    const testLines = [
        'start:',
        '    move.l #1000, d0',
        '.loop:',
        '    add.l #1, d0',
        '    blt .loop',
        'subroutine:',
        '    move.l #5000, d1',
        '.loop:',  // Different .loop in different scope
        '    sub.l #1, d1',
        '    bgt .loop'
    ];

    // Test global label detection
    const globalLabelRegex = /^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/;
    console.log('  Global labels found:');
    testLines.forEach((line, index) => {
        const match = line.match(globalLabelRegex);
        if (match && !match[1].startsWith('.')) {
            console.log(`    Line ${index + 1}: ${match[1]}`);
        }
    });

    // Test local label detection
    const localLabelRegex = /^\s*(\.([a-zA-Z_][a-zA-Z0-9_]*))\s*:/;
    console.log('  Local labels found:');
    testLines.forEach((line, index) => {
        const match = line.match(localLabelRegex);
        if (match) {
            console.log(`    Line ${index + 1}: ${match[1]}`);
        }
    });
    
    console.log('');
}

function testScopeLogic() {
    console.log('🧪 Testing Scope Logic');
    
    const lines = fs.readFileSync(testFilePath, 'utf8').split('\n');
    
    // Simulate getCurrentGlobalScope logic
    function getCurrentGlobalScope(lines, position) {
        for (let i = position; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';') || line.startsWith('*')) continue;
            
            const globalLabelMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
            if (globalLabelMatch) {
                const labelName = globalLabelMatch[1];
                if (!labelName.startsWith('.')) {
                    return labelName;
                }
            }
        }
        return undefined;
    }
    
    // Test scoping at different positions
    const testPositions = [
        { line: 3, description: 'line 4 (inside start scope)' },
        { line: 6, description: 'line 7 (reference to .loop in start)' },
        { line: 11, description: 'line 12 (inside subroutine scope)' },
        { line: 14, description: 'line 15 (reference to .loop in subroutine)' },
        { line: 27, description: 'line 28 (inside test_invalid_scope)' }
    ];
    
    testPositions.forEach(({ line, description }) => {
        const scope = getCurrentGlobalScope(lines, line);
        console.log(`  At ${description}: scope = ${scope || 'none'}`);
    });
    
    console.log('');
}

function testSymbolParsing() {
    console.log('🧪 Testing Symbol Parsing Logic');
    
    const lines = fs.readFileSync(testFilePath, 'utf8').split('\n');
    const symbols = [];
    let currentGlobalLabel = undefined;

    lines.forEach((line, lineIndex) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('*')) return;

        // Global label
        const globalLabelMatch = trimmed.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
        if (globalLabelMatch) {
            const labelName = globalLabelMatch[1];
            if (!labelName.startsWith('.')) {
                currentGlobalLabel = labelName;
                symbols.push({
                    name: labelName,
                    line: lineIndex,
                    type: 'label',
                    isLocal: false
                });
                return;
            }
        }

        // Local label
        const localLabelMatch = trimmed.match(/^\s*(\.([a-zA-Z_][a-zA-Z0-9_]*))\s*:/);
        if (localLabelMatch) {
            const fullLabelName = localLabelMatch[1];
            symbols.push({
                name: fullLabelName,
                line: lineIndex,
                type: 'label',
                isLocal: true,
                globalScope: currentGlobalLabel
            });
        }
    });

    console.log('  Parsed symbols:');
    symbols.forEach(symbol => {
        const scope = symbol.isLocal && symbol.globalScope ? ` (scope: ${symbol.globalScope})` : '';
        const type = symbol.isLocal ? 'Local' : 'Global';
        console.log(`    ${type}: ${symbol.name} at line ${symbol.line + 1}${scope}`);
    });
    
    console.log('');
    return symbols;
}

function testScopingLookup(symbols) {
    console.log('🧪 Testing Scoping Lookup');
    
    const lines = fs.readFileSync(testFilePath, 'utf8').split('\n');
    
    function getCurrentGlobalScope(lines, position) {
        for (let i = position; i >= 0; i--) {
            const line = lines[i].trim();
            if (!line || line.startsWith(';') || line.startsWith('*')) continue;
            
            const globalLabelMatch = line.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
            if (globalLabelMatch) {
                const labelName = globalLabelMatch[1];
                if (!labelName.startsWith('.')) {
                    return labelName;
                }
            }
        }
        return undefined;
    }

    function isLocalLabelVisible(localSymbol, searchLines, searchPosition) {
        if (!localSymbol.isLocal || !localSymbol.globalScope) {
            return false;
        }
        
        const currentScope = getCurrentGlobalScope(searchLines, searchPosition);
        return currentScope === localSymbol.globalScope;
    }

    // Test 1: Find .loop from start scope (line 6)
    console.log('  Test 1: Find .loop from start scope (line 6)');
    const searchPosition1 = 6;
    const loopSymbols = symbols.filter(s => s.name === '.loop' && s.isLocal);
    let foundInStart = null;
    for (const symbol of loopSymbols) {
        if (isLocalLabelVisible(symbol, lines, searchPosition1)) {
            foundInStart = symbol;
            break;
        }
    }
    if (foundInStart && foundInStart.globalScope === 'start') {
        console.log(`    ✅ Found .loop in start scope at line ${foundInStart.line + 1}`);
    } else {
        console.log(`    ❌ Failed to find .loop in start scope`);
    }

    // Test 2: Find .loop from subroutine scope (line 14)
    console.log('  Test 2: Find .loop from subroutine scope (line 14)');
    const searchPosition2 = 14;
    let foundInSubroutine = null;
    for (const symbol of loopSymbols) {
        if (isLocalLabelVisible(symbol, lines, searchPosition2)) {
            foundInSubroutine = symbol;
            break;
        }
    }
    if (foundInSubroutine && foundInSubroutine.globalScope === 'subroutine') {
        console.log(`    ✅ Found .loop in subroutine scope at line ${foundInSubroutine.line + 1}`);
    } else {
        console.log(`    ❌ Failed to find .loop in subroutine scope`);
    }

    // Test 3: Try to find .loop from test_invalid_scope (line 27) - should fail
    console.log('  Test 3: Try to find .loop from test_invalid_scope (line 27) - should fail');
    const searchPosition3 = 27;
    let foundInInvalid = null;
    for (const symbol of loopSymbols) {
        if (isLocalLabelVisible(symbol, lines, searchPosition3)) {
            foundInInvalid = symbol;
            break;
        }
    }
    if (!foundInInvalid) {
        console.log(`    ✅ Correctly failed to find .loop in invalid scope`);
    } else {
        console.log(`    ❌ Incorrectly found .loop in invalid scope: ${foundInInvalid.globalScope}`);
    }

    // Test 4: Find global label from any scope
    console.log('  Test 4: Find global label "start" from any scope');
    const startSymbol = symbols.find(s => s.name === 'start' && !s.isLocal);
    if (startSymbol) {
        console.log(`    ✅ Found global label "start" at line ${startSymbol.line + 1}`);
    } else {
        console.log(`    ❌ Failed to find global label "start"`);
    }
}

// Run all tests
testRegexPatterns();
testScopeLogic();
const symbols = testSymbolParsing();
testScopingLookup(symbols);

console.log('🎯 Local Label Scoping Core Logic Test Complete!');
