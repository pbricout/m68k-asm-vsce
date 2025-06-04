/**
 * Quick integration test to verify the fixes work
 */
import * as path from 'path';
import { TestDataGenerator, createTempDir, cleanupTempDir, parseTestFile, getCacheStats } from './src/testUtils';

async function runIntegrationTest() {
    const tempDir = createTempDir('integration-test-');
    
    try {
        console.log('Creating test project...');
        const project = TestDataGenerator.generateTestProject(tempDir);
        
        console.log('Testing file parsing...');
        const symbols = await parseTestFile(project.mainFile);
        console.log(`Found ${symbols.length} symbols in main file`);
        
        console.log('Testing cache stats...');
        const stats = getCacheStats();
        console.log(`Cache stats: ${stats.fileCache} files, ${stats.symbolCache} symbol entries`);
        
        console.log('Integration test completed successfully!');
        
    } catch (error) {
        console.error('Integration test failed:', error);
    } finally {
        cleanupTempDir(tempDir);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    runIntegrationTest();
}
