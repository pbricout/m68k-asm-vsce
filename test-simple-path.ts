/**
 * Simple test for path resolution without VS Code dependencies
 */
import * as path from 'path';
import * as fs from 'fs';

console.log('🧪 Testing Core Path Resolution Logic');

// Test the exact scenario from the logs
const testIncludePath = 'ASM_LIBS\\MACROS.I';
const baseDir = 'c:\\Users\\Patrick\\ShadowDrive\\Dev\\Projects\\m68K-assembly-extension';
const projectRoot = 'c:\\Users\\Patrick\\ShadowDrive\\Dev\\Projects\\m68K-assembly-extension';
const fallbackPath = 'c:\\Users\\Patrick\\ShadowDrive\\Dev\\Projects\\m68K-assembly-extension\\includes';

console.log('\n📋 Test Parameters:');
console.log(`Include Path: "${testIncludePath}"`);
console.log(`Base Dir: "${baseDir}"`);
console.log(`Project Root: "${projectRoot}"`);
console.log(`Fallback Path: "${fallbackPath}"`);

// Simulate the path resolution logic from our fixed resolveIncludePath function
console.log('\n🔧 Testing Path Resolution:');

// Clean up the include path by removing quotes and trimming
const cleanPath = testIncludePath.replace(/['"]/g, '').trim();
console.log(`Clean Path: "${cleanPath}"`);

// Try paths in order of preference
const searchPaths = [baseDir, projectRoot, fallbackPath];

for (const searchDir of searchPaths) {
    // Use path.resolve to handle cross-platform path resolution
    const candidate = path.resolve(searchDir, cleanPath);
    
    console.log(`Checking: "${searchDir}" + "${cleanPath}" = "${candidate}"`);
    console.log(`  Exists: ${fs.existsSync(candidate)}`);
    
    if (fs.existsSync(candidate)) {
        console.log(`✅ SUCCESS: Include file found at: "${candidate}"`);
        
        // Read and verify content
        try {
            const content = fs.readFileSync(candidate, 'utf8');
            if (content.includes('SCREEN_WIDTH')) {
                console.log('✅ SUCCESS: File contains expected constants');
            } else {
                console.log('⚠️  WARNING: File exists but missing expected constants');
            }
        } catch (error) {
            console.log(`❌ ERROR: Could not read file: ${error}`);
        }
        break;
    }
}

console.log('\n📄 Testing Include Statement Regex:');
// Test the regex pattern without importing from regexPatterns
const INCLUDE_STATEMENT = /^\s*include\s+["']?([^"'\s]+)["']?\s*$/i;
const testLine = '        include ASM_LIBS\\MACROS.I';
const match = testLine.match(INCLUDE_STATEMENT);
console.log(`Test line: "${testLine}"`);
console.log(`Regex match: ${match ? `"${match[1]}"` : 'null'}`);

console.log('\n✅ Core path resolution test completed!');
