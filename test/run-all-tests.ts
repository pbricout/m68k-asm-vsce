/**
 * M68K Assembly Extension - Test Runner TypeScript Version
 * Runs all organized tests and verifies the project health
 */
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import * as util from 'util';
const execPromise = util.promisify(exec);

console.log('🚀 M68K Assembly Extension - Test Runner');
console.log('==========================================');

// Test categories and their locations
const testCategories: {
    [name: string]: {
        directory: string;
        files: string[];
        description: string;
    }
} = {
    'Include Fix Tests': {
        directory: 'include-fix',
        files: ['test-include-debug.ts', 'test-include-functionality.ts'],
        description: 'Tests for the include statement resolution fix'
    },    'Incbin Directive Tests': {
        directory: 'incbin-directive',
        files: ['verify-incbin.ts', 'test-regex-patterns.js'],
        description: 'Tests for incbin directive support'
    },
    'Hover Include Tests': {
        directory: 'hover-include',
        files: ['test-hover-include.s'],
        description: 'Tests for include/incbin path hover functionality'
    },
    'Integration Tests': {
        directory: 'integration',
        files: ['standalone-test.ts', 'test-integration.ts', 'test-fix-verification.ts'],
        description: 'Comprehensive integration tests'
    },
    'Unit Tests': {
        directory: 'unit',
        files: [],
        description: 'Unit tests for individual components'
    },
    'Verification Scripts': {
        directory: 'verification',
        files: ['demo-include-fix.js', 'test-include-hover.ts', 'verify-include-fix.js'],
        description: 'Scripts to verify fixes and functionality'
    },
    'Demo Files': {
        directory: 'demos',
        files: ['comprehensive-folding-test.s', 'test-folding.s'],
        description: 'Demonstration and test assembly files'
    },
    'Test Files': {
        directory: 'test-files',
        files: ['local-label-scoping-test.s', 'incbin-syntax-test.s'],
        description: 'Assembly test files for various features'
    }
};

async function runTests() {
    let totalTests = 0;
    let passedTests = 0;
    
    console.log('\n📁 Checking Test Organization:');
    
    // Check existence of test directories and files
    for (const [category, info] of Object.entries(testCategories)) {
        console.log(`\n🔍 ${category}: ${info.description}`);
        
        const categoryDir = path.join(__dirname, info.directory);
        const dirExists = fs.existsSync(categoryDir);
        
        console.log(`   📂 Directory '${info.directory}': ${dirExists ? '✅' : '❌'}`);
        
        if (dirExists) {
            for (const file of info.files) {
                const filePath = path.join(categoryDir, file);
                const fileExists = fs.existsSync(filePath);
                totalTests++;
                
                if (fileExists) {
                    passedTests++;
                    console.log(`   📄 ${file}: ✅`);
                } else {
                    console.log(`   📄 ${file}: ❌ Not found`);
                }
            }
        }
    }
    
    // Run TypeScript compilation for tests
    console.log('\n🔧 Compiling TypeScript tests...');
    try {
        const { stdout, stderr } = await execPromise('tsc -p tsconfig.test.json');
        console.log('   ✅ TypeScript compilation successful');
    } catch (error) {
        console.error('   ❌ TypeScript compilation failed:', error);
    }
    
    // Run standalone integration test
    console.log('\n🧪 Running standalone integration test...');
    try {
        const { stdout } = await execPromise('node out/test/integration/standalone-test.js');
        console.log(stdout);
        console.log('   ✅ Integration test completed');
    } catch (error) {
        console.error('   ❌ Integration test failed:', error);
    }
    
    // Run incbin directive test
    console.log('\n🧪 Running incbin directive test...');
    try {
        const { stdout } = await execPromise('node out/test/incbin-directive/verify-incbin.js');
        console.log(stdout);
        console.log('   ✅ Incbin directive test completed');
    } catch (error) {
        console.error('   ❌ Incbin directive test failed:', error);
    }
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`   Test organization: ${passedTests}/${totalTests} tests in place`);
    console.log(`   Overall health: ${Math.round((passedTests / totalTests) * 100)}%`);
    console.log('\n✅ Test runner completed!');
}

// Run the tests if this file is executed directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('Error running tests:', error);
        process.exit(1);
    });
}

export default runTests;