# Include Path Hover Test

This test suite verifies the include/incbin path resolution hover functionality.

## Test Structure

- `test-hover-include.s` - Main test file with various include/incbin directives
- `fixtures/` - Test fixture files that are referenced by the includes

### Fixtures

- `fixtures/path/file.i` - Standard include file with M68K constants
- `fixtures/path/file.bin` - Binary file for incbin testing
- `fixtures/quoted/path/file.inc` - Include file in quoted path
- `fixtures/single-quoted/path/data.bin` - Binary file in single-quoted path

## How to Test

1. Open `test-hover-include.s` in VS Code
2. Hover over any of the file paths in the include/incbin directives
3. Verify that the hover shows:
   - Workspace-relative path
   - Full absolute path
   - File existence status
   - File size (for existing files)
   - Search paths used

## Expected Behavior

The hover should resolve all paths correctly and show:
- ✅ File exists for all fixture files
- Correct relative paths from the workspace root
- Proper handling of both quoted and unquoted paths
- Support for both backslash and forward slash separators

## Verification Script

Run the verification script: `test/verification/test-include-hover.ts`
This provides programmatic test cases for the hover functionality.
