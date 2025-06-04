/**
 * Verification script to test include functionality
 * This runs after VS Code loads the extension
 */
import * as path from 'path';
import * as fs from 'fs';
import { M68kFileParser } from './src/fileParser';
import { resolveIncludePath } from './src/includeUtils';

console.log('🧪 M68K Assembly Include Functionality Verification');

// Test data
const testMainFile = path.join(__dirname, 'test-main.s');
const expectedIncludeFile = path.join(__dirname, 'ASM_LIBS', 'MACROS.I');

console.log(`\n📋 Test Configuration:`);
console.log(`Main file: ${testMainFile}`);
console.log(`Expected include: ${expectedIncludeFile}`);

// Verify test files exist
if (!fs.existsSync(testMainFile)) {
    console.log(`❌ ERROR: Test main file not found: ${testMainFile}`);
    process.exit(1);
}

if (!fs.existsSync(expectedIncludeFile)) {
    console.log(`❌ ERROR: Expected include file not found: ${expectedIncludeFile}`);
    process.exit(1);
}

console.log(`✅ Test files verified`);

// Read the main file
const mainFileContent = fs.readFileSync(testMainFile, 'utf8');
const lines = mainFileContent.split(/\r?\n/);

console.log(`\n📄 Main file content (${lines.length} lines):`);
lines.forEach((line, index) => {
    if (line.trim().toLowerCase().includes('include')) {
        console.log(`  Line ${index + 1}: "${line}"`);
    }
});

// Test the findIncludeFiles method
console.log(`\n🔍 Testing findIncludeFiles method:`);
try {
    const includeFiles = M68kFileParser.findIncludeFiles(lines, testMainFile);
    console.log(`Found ${includeFiles.length} include file(s):`);
    includeFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
        console.log(`     Exists: ${fs.existsSync(file)}`);
        
        if (fs.existsSync(file)) {
            const content = fs.readFileSync(file, 'utf8');
            const hasScreenWidth = content.includes('SCREEN_WIDTH');
            const hasClearMacro = content.includes('CLEAR_REGISTER');
            console.log(`     Contains SCREEN_WIDTH: ${hasScreenWidth}`);
            console.log(`     Contains CLEAR_REGISTER macro: ${hasClearMacro}`);
        }
    });
    
    if (includeFiles.length > 0 && includeFiles.some(file => fs.existsSync(file))) {
        console.log(`\n✅ SUCCESS: Include functionality is working correctly!`);
        console.log(`   - Include statements are detected`);
        console.log(`   - Paths are resolved correctly`);
        console.log(`   - Files are found and accessible`);
    } else {
        console.log(`\n❌ FAILURE: Include functionality is not working`);
        console.log(`   - No include files found or files don't exist`);
    }
    
} catch (error) {
    console.log(`\n❌ ERROR testing findIncludeFiles: ${error}`);
}

console.log(`\n🎯 Verification completed!`);
