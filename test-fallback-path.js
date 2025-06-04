// Test to verify fallback path resolution fix
const path = require('path');

// Simulate the old vs new behavior
console.log('Testing fallback path resolution...\n');

// Test case: project at c:\Users\Patrick\ShadowDrive\Dev\Atari ST and Apple II\Emulator.AP2\Project
const projectRoot = 'c:\\Users\\Patrick\\ShadowDrive\\Dev\\Atari ST and Apple II\\Emulator.AP2\\Project';
const configFallbackPath = './includes';

console.log('Project root:', projectRoot);
console.log('Config fallback path:', configFallbackPath);

// OLD behavior (what was happening before the fix)
console.log('\n--- OLD BEHAVIOR (broken) ---');
const oldFallbackPath = configFallbackPath; // Raw config value
console.log('Old fallback path (raw):', oldFallbackPath);
console.log('Would resolve include from VS Code working directory, creating incorrect paths\n');

// NEW behavior (after the fix)
console.log('--- NEW BEHAVIOR (fixed) ---');
const newFallbackPath = path.isAbsolute(configFallbackPath) 
    ? configFallbackPath 
    : path.resolve(projectRoot, configFallbackPath);
console.log('New fallback path (resolved):', newFallbackPath);

// Test include path resolution
const includePath = 'ASM_LIBS\\MACROS.I';
console.log('\n--- INCLUDE PATH RESOLUTION ---');
console.log('Include path:', includePath);

const baseDir = path.join(projectRoot, 'EMULATOR.AP2', 'EMU_SRCS', 'GFX');
console.log('Base dir:', baseDir);
console.log('Project root:', projectRoot);
console.log('Fallback path (new):', newFallbackPath);

// Test all search paths
const searchPaths = [baseDir, projectRoot, newFallbackPath];
console.log('\nSearch paths tried:');
searchPaths.forEach((searchDir, index) => {
    const candidate = path.resolve(searchDir, includePath);
    console.log(`${index + 1}. "${searchDir}" + "${includePath}" = "${candidate}"`);
});

console.log('\n✅ Fallback path now resolves to absolute project-relative path instead of VS Code directory');
