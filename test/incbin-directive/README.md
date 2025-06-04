# Incbin Directive Tests

This folder contains tests to verify the support for `incbin` directives in the M68K assembly extension.

## Test Files

- `verify-incbin.ts` - Verifies that the extension supports `incbin` directives properly
- `test-regex-patterns.js` - Validates regex patterns for include and incbin directives
- `../test-files/incbin-syntax-test.s` - Test assembly file with various `incbin` patterns

## Features Tested

1. **Syntax Highlighting**
   - Consistent highlighting for both quoted and unquoted paths
   - Recognition of `incbin` as a directive

2. **F12 Go to Definition**
   - Navigation to binary files referenced by `incbin`
   - Works with quoted and unquoted paths

3. **RegexPattern Support**
   - `INCBIN_STATEMENT` pattern matches incbin directives
   - `INCLUDE_PATH_PATTERN` matches both include and incbin

## Running the Tests

From the project root, you can run:

```bash
npm test
```

Or to run just the incbin tests:

```bash
node out/test/incbin-directive/verify-incbin.js
node test/incbin-directive/test-regex-patterns.js
```

## Test Patterns

The tests verify the following usage patterns:

```assembly
; Unquoted path
incbin DATA\GRAPHICS.BIN

; Double-quoted path
incbin "DATA\GRAPHICS.BIN"

; Single-quoted path
incbin 'DATA\GRAPHICS.BIN'

; Forward slashes
incbin IMAGES/SPRITE.RAW
```

All these patterns should have consistent syntax highlighting and F12 navigation support.
