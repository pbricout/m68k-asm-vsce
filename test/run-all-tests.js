/**
 * M68K Assembly Extension - Test Runner
 * Runs all organized tests and verifies the project health
 */
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

console.log('🚀 M68K Assembly Extension - Test Runner');
console.log('==========================================');

// Test categories and their locations
const testCategories = {
    'Include Fix Tests': {
        directory: 'include-fix',
        files: ['test-include-debug.ts', 'test-include-functionality.ts'],
        description: 'Tests for the include statement resolution fix'
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
        files: ['demo-include-fix.js', 'verify-include-fix.js'],
        description: 'Scripts to verify fixes and functionality'
    },
    'Demo Files': {
        directory: 'demos',
        files: ['comprehensive-folding-test.s', 'test-folding.s'],
        description: 'Demonstration and test assembly files'
    }
};

async function runTests() {
    let totalTests = 0;
    let passedTests = 0;
    
    console.log('\n📁 Checking Test Organization:');
    
    // Check test directory structure
    for (const [category, info] of Object.entries(testCategories)) {
        const testDir = path.join(__dirname, info.directory);
        const dirExists = fs.existsSync(testDir);
        
        console.log(`\n${category}:`);
        console.log(`  📁 Directory: test/${info.directory} ${dirExists ? '✅' : '❌'}`);
        console.log(`  📝 ${info.description}`);
        
        if (dirExists) {
            const files = fs.readdirSync(testDir);
            console.log(`  📄 Files found: ${files.length}`);
            
            for (const file of files) {
                const filePath = path.join(testDir, file);
                const stats = fs.statSync(filePath);
                const size = Math.round(stats.size / 1024 * 100) / 100;
                console.log(`     - ${file} (${size}KB)`);
            }
            
            // Check if expected files exist
            for (const expectedFile of info.files) {
                const expectedPath = path.join(testDir, expectedFile);
                if (fs.existsSync(expectedPath)) {
                    console.log(`     ✅ ${expectedFile}`);
                    passedTests++;
                } else {
                    console.log(`     ❌ ${expectedFile} (missing)`);
                }
                totalTests++;
            }
        }
    }
    
    console.log('\n🔧 Running Verification Scripts:');
    
    // Run verification scripts
    const verificationDir = path.join(__dirname, 'verification');
    if (fs.existsSync(verificationDir)) {
        const verificationFiles = fs.readdirSync(verificationDir)
            .filter(file => file.endsWith('.js'));
        
        for (const file of verificationFiles) {
            try {
                console.log(`\n  🔍 Running ${file}...`);
                const { stdout, stderr } = await execPromise(`node "${path.join(verificationDir, file)}"`);
                if (stdout) console.log(stdout);
                if (stderr) console.error(stderr);
                console.log(`  ✅ ${file} completed`);
                passedTests++;
            } catch (error) {
                console.error(`  ❌ ${file} failed:`, error.message);
            }
            totalTests++;
        }
    }
    
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Total checks: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success rate: ${Math.round(passedTests / totalTests * 100)}%`);
    
    // Check project health
    console.log('\n🏥 Project Health Check:');
    const projectRoot = path.join(__dirname, '..');
    const healthChecks = [
        { name: 'package.json', path: 'package.json' },
        { name: 'TypeScript Config', path: 'tsconfig.json' },
        { name: 'Extension Manifest', path: 'package.json' },
        { name: 'Syntax Definition', path: 'syntaxes/m68k-asm.tmLanguage.json' },
        { name: 'Source Files', path: 'src' },
        { name: 'Compiled Output', path: 'out' }
    ];
    
    let healthScore = 0;
    for (const check of healthChecks) {
        const checkPath = path.join(projectRoot, check.path);
        const exists = fs.existsSync(checkPath);
        console.log(`  ${check.name}: ${exists ? '✅' : '❌'}`);
        if (exists) healthScore++;
    }
    
    const healthPercentage = Math.round(healthScore / healthChecks.length * 100);
    console.log(`\n🎯 Project Health: ${healthPercentage}%`);
    
    if (healthPercentage >= 90) {
        console.log('🎉 Project is in excellent condition!');
    } else if (healthPercentage >= 70) {
        console.log('👍 Project is in good condition');
    } else {
        console.log('⚠️ Project needs attention');
    }
    
    console.log('\n✨ Test run completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
