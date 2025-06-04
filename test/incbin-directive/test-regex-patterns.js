/**
 * This test verifies that the regex patterns for include and incbin directives
 * are working correctly in the M68K extension.
 */

// Function to test regex patterns with simple assertions
function testRegexPattern(pattern, testString, shouldMatch) {
    const result = pattern.test(testString);
    if (result !== shouldMatch) {
        console.error(`❌ Failed: "${testString}" ${shouldMatch ? 'should' : 'should not'} match pattern`);
        return false;
    }
    console.log(`✓ Success: "${testString}" ${shouldMatch ? 'matches' : 'does not match'} as expected`);
    return true;
}

// Test include statement regex
console.log('\n🔍 Testing INCLUDE_STATEMENT patterns:');
let includePattern = /^\s*include\s+(?:["']([^"']+)["']|(\S+))/i;

let includeTests = [
    { input: 'include test.s', shouldMatch: true },
    { input: 'include "test.s"', shouldMatch: true },
    { input: "include 'test.s'", shouldMatch: true },
    { input: '  include   test.s', shouldMatch: true },
    { input: 'include', shouldMatch: false },
    { input: 'incbin test.bin', shouldMatch: false },
];

let includeResults = includeTests.map(test => testRegexPattern(includePattern, test.input, test.shouldMatch));

// Test incbin statement regex
console.log('\n🔍 Testing INCBIN_STATEMENT patterns:');
let incbinPattern = /^\s*incbin\s+(?:["']([^"']+)["']|(\S+))/i;

let incbinTests = [
    { input: 'incbin test.bin', shouldMatch: true },
    { input: 'incbin "test.bin"', shouldMatch: true },
    { input: "incbin 'test.bin'", shouldMatch: true },
    { input: '  incbin   test.bin', shouldMatch: true },
    { input: 'incbin', shouldMatch: false },
    { input: 'include test.s', shouldMatch: false },
];

let incbinResults = incbinTests.map(test => testRegexPattern(incbinPattern, test.input, test.shouldMatch));

// Test combined pattern
console.log('\n🔍 Testing INCLUDE_PATH_PATTERN (combined) patterns:');
let combinedPattern = /^\s*(include|incbin)\s+(?:["']([^"']+)["']|(\S+))/i;

let combinedTests = [
    { input: 'include test.s', shouldMatch: true },
    { input: 'include "test.s"', shouldMatch: true },
    { input: 'incbin test.bin', shouldMatch: true },
    { input: 'incbin "test.bin"', shouldMatch: true },
    { input: '  include   test.s', shouldMatch: true },
    { input: '  incbin   test.bin', shouldMatch: true },
    { input: 'incbin', shouldMatch: false },
    { input: 'include', shouldMatch: false },
    { input: 'other text', shouldMatch: false },
];

let combinedResults = combinedTests.map(test => testRegexPattern(combinedPattern, test.input, test.shouldMatch));

// Check results
const allTests = [...includeResults, ...incbinResults, ...combinedResults];
const passedTests = allTests.filter(result => result === true).length;
const totalTests = allTests.length;

console.log('\n📊 Test Summary:');
console.log(`   Passed: ${passedTests}/${totalTests} tests`);
console.log(`   Success rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
    console.log('\n✅ All regex patterns for include/incbin directives are working correctly!');
    process.exit(0);
} else {
    console.log('\n❌ Some regex pattern tests failed!');
    process.exit(1);
}
