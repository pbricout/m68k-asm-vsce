# Test Directory Organization

This directory contains all tests and test-related files for the M68K Assembly VS Code Extension, organized into logical subdirectories.

## Directory Structure

```
test/
├── run-all-tests.js          # Main test runner script
├── README.md                 # This file
├── demos/                    # Demo assembly files and examples
│   ├── comprehensive-folding-test.s
│   └── test-folding.s
├── fixtures/                 # Test data and fixture files
│   ├── ASM_LIBS/
│   │   └── MACROS.I         # Test include file
│   └── includes/
│       └── MACROS.I         # Fallback include file
├── include-fix/              # Tests for include statement resolution fix
│   ├── test-include-debug.ts
│   ├── test-include-functionality.ts
│   └── test-main.s          # Test assembly file with includes
├── integration/              # Integration tests
│   ├── standalone-test.ts    # Comprehensive integration test
│   ├── test-integration.ts   # Basic integration test
│   └── test-fix-verification.ts
├── unit/                     # Unit tests for individual components
│   └── (unit test files)
└── verification/             # Verification and demo scripts
    ├── demo-include-fix.js   # Demonstrates the include fix working
    └── verify-include-fix.js # Verifies the include functionality
```

## Test Categories

### 1. Include Fix Tests (`include-fix/`)
Tests specifically for the include statement resolution bug that was fixed. These tests verify that:
- Include statements are properly detected
- File paths are correctly resolved across platforms
- Fallback paths work correctly
- The fix handles both Windows and Unix-style paths

**Key Files:**
- `test-include-debug.ts` - Debug utilities for include testing
- `test-include-functionality.ts` - Functional tests for include resolution
- `test-main.s` - Test assembly file with include statements

### 2. Integration Tests (`integration/`)
Comprehensive tests that validate the extension's overall functionality:
- Module compilation verification
- Pattern recognition testing
- File parsing validation
- Configuration checking

**Key Files:**
- `standalone-test.ts` - Main integration test (can run without VS Code)
- `test-integration.ts` - VS Code-specific integration test
- `test-fix-verification.ts` - Verification that fixes work correctly

### 3. Unit Tests (`unit/`)
Individual component tests for specific functionality areas.

### 4. Verification Scripts (`verification/`)
Standalone scripts that demonstrate and verify fixes:
- `demo-include-fix.js` - Shows the include fix in action
- `verify-include-fix.js` - Automated verification of include functionality

### 5. Demo Files (`demos/`)
Assembly files used for testing various extension features:
- `comprehensive-folding-test.s` - Tests code folding functionality
- `test-folding.s` - Additional folding tests

### 6. Fixtures (`fixtures/`)
Test data and sample files:
- `ASM_LIBS/MACROS.I` - Test include file in library directory
- `includes/MACROS.I` - Fallback include file

## Running Tests

### Run All Tests
```bash
cd test
node run-all-tests.js
```

### Run Specific Test Categories
```bash
# Integration tests
cd integration
npm test

# Verification scripts
cd verification
node demo-include-fix.js
node verify-include-fix.js
```

### TypeScript Tests
Make sure to compile TypeScript tests first:
```bash
# From project root
npm run compile
```

## Test Development Guidelines

1. **Organization**: Place tests in the appropriate subdirectory based on their purpose
2. **Naming**: Use descriptive names that indicate what is being tested
3. **Documentation**: Include comments explaining complex test scenarios
4. **Independence**: Tests should be able to run independently
5. **Cleanup**: Ensure tests clean up any temporary files they create

## Recent Changes

The test directory was recently reorganized (June 2025) to:
- ✅ Move all test files from the project root into proper subdirectories
- ✅ Separate concerns (unit vs integration vs verification)
- ✅ Remove duplicate files
- ✅ Clean up compiled JavaScript artifacts
- ✅ Create comprehensive test runner
- ✅ Document the organization

## Test Status

- **Include Fix**: ✅ Fully tested and verified
- **Integration**: ✅ Comprehensive test suite
- **Unit Tests**: 📝 Framework in place, tests can be added as needed
- **Verification**: ✅ Automated verification scripts working

The extension's core functionality, especially the include statement resolution bug fix, has been thoroughly tested and verified to work correctly across different platforms.
