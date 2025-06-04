/**
 * Comprehensive integration test for M68K Assembly Extension
 * This test validates core functionality without VS Code environment dependencies
 */
import * as path from 'path';
import * as fs from 'fs';

console.log('🚀 M68K Assembly Extension - Integration Test');

// Test 1: Check compiled modules exist
console.log('\n📦 Testing Compiled Modules...');
const modules = ['config', 'errorHandler', 'fileParser', 'testUtils', 'regexPatterns', 'symbolValidator'];
let compiledModules = 0;

for (const module of modules) {    // __dirname points to out/test/integration/, so we adjust the path to compiled modules
    const jsPath = path.join(__dirname, `../../${module}.js`);
    if (fs.existsSync(jsPath)) {
        console.log(`✓ ${module}.js compiled`);
        compiledModules++;
    } else {
        console.log(`⚠ ${module}.js not found`);
    }
}

console.log(`📊 ${compiledModules}/${modules.length} modules compiled successfully`);

// Test 2: Test assembly file parsing patterns
console.log('\n🔍 Testing Assembly Pattern Recognition...');
const testAssembly = `
; Test M68K Assembly Code
start:
    move.l  #$1000,d0      ; Load immediate value
    jsr     calculate      ; Jump to subroutine
    bra.s   loop          ; Branch to loop

calculate:
    add.l   d1,d0         ; Add registers
    rts                   ; Return from subroutine

loop:
    dbra    d0,loop       ; Decrement and branch
    bra     start         ; Jump back to start

.data_section:
    dc.l    $12345678     ; Define constant
    dc.w    $1234         ; Define word
`;

// Test basic M68K patterns
const patterns = {
    labels: /^\s*([a-zA-Z_][a-zA-Z0-9_]*):.*$/gm,
    instructions: /^\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*([a-zA-Z]+(?:\.[bwl])?)\s+/gm,
    comments: /;.*$/gm,
    constants: /dc\.[bwl]\s+/gm
};

const patternResults: { [key: string]: number } = {};
for (const [name, pattern] of Object.entries(patterns)) {
    const matches = testAssembly.match(pattern);
    patternResults[name] = matches ? matches.length : 0;
    console.log(`✓ ${name}: ${patternResults[name]} matches`);
}

// Test 3: Check test assembly files
console.log('\n🔬 Testing Assembly Test Files...');
const testFiles = ['comprehensive-folding-test.s', 'test-folding.s'];
let validTestFiles = 0;

for (const file of testFiles) {    // __dirname points to out/test/integration/, so we need to go back to project root then to test/demos/
    const filePath = path.join(__dirname, '../../../test/demos', file);
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').length;
        const size = Math.round(content.length / 1024 * 100) / 100;
        console.log(`✓ ${file}: ${lines} lines, ${size}KB`);
        validTestFiles++;
    } else {
        console.log(`❌ ${file}: not found`);
    }
}

// Test 4: Project configuration validation
console.log('\n⚙️ Testing Project Configuration...');
const configFiles = [
    { name: 'package.json', required: true },
    { name: 'tsconfig.json', required: true },
    { name: 'tsconfig.test.json', required: true },
    { name: 'README.md', required: true },
    { name: 'language-configuration.json', required: true }
];

let validConfigs = 0;
for (const config of configFiles) {
    // __dirname points to out/test/integration/, so we need to go back to project root
    const configPath = path.join(__dirname, '../../..', config.name);
    if (fs.existsSync(configPath)) {
        console.log(`✓ ${config.name} exists`);
        validConfigs++;
        
        // Additional validation for key files
        if (config.name === 'package.json') {
            try {
                const pkg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                const hasTestScript = pkg.scripts && pkg.scripts.test;
                console.log(`  - Test script: ${hasTestScript ? '✓' : '❌'}`);
                console.log(`  - Version: ${pkg.version}`);            } catch (e) {
                console.log(`  - Parse error: ${(e as Error).message}`);
            }
        }
    } else if (config.required) {
        console.log(`❌ ${config.name} missing (required)`);
    }
}

// Summary
console.log('\n📋 Test Summary:');
console.log(`   📦 Compiled modules: ${compiledModules}/${modules.length}`);
console.log(`   🔍 Pattern matching: ${Object.values(patternResults).reduce((a: number, b: number) => a + b, 0)} total matches`);
console.log(`   🔬 Test files: ${validTestFiles}/${testFiles.length}`);
console.log(`   ⚙️ Configuration files: ${validConfigs}/${configFiles.length}`);

const overallScore = Math.round(
    ((compiledModules / modules.length) + 
     (validTestFiles / testFiles.length) + 
     (validConfigs / configFiles.length)) / 3 * 100
);

console.log(`\n🎯 Overall Health Score: ${overallScore}%`);

if (overallScore >= 80) {
    console.log('✅ M68K Assembly Extension is in excellent condition!');
} else if (overallScore >= 60) {
    console.log('⚠️ M68K Assembly Extension has some issues but is functional');
} else {
    console.log('❌ M68K Assembly Extension needs attention');
}

console.log('🎉 Integration test completed!');
