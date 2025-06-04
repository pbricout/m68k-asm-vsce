# M68K Assembly Language Support for VS Code

A comprehensive Visual Studio Code extension that provides full language support for Motorola 68000 (M68K)
assembly language programming.

## Features

### ✨ Syntax Highlighting

- Complete syntax highlighting for M68K assembly instructions
- Support for all addressing modes and operand types
- Highlighting for registers, numbers (hex, binary, octal, decimal), strings, and comments
- Proper colorization for labels, directives, and constants

### 🔍 IntelliSense Features

- **Go to Definition**: Jump to label and constant definitions
- **Find All References**: Find all uses of labels and constants
- **Rename Symbol**: Safely rename labels and user-defined symbols
- **Hover Information**: Get detailed information including:
  - Instruction descriptions and syntax
  - Cycle timing information for each instruction
  - Register descriptions
  - Symbol definitions

### 📁 Code Navigation

- **Document Outline**: View all labels, constants, macros, and sections in the outline
- **Code Folding**
  - Section folding (`SECTION`, `BSS`, `DATA`, `TEXT`)
  - Macro definitions (`MACRO` to `ENDM`)
  - Conditional blocks (`IF` to `ENDIF`)
  - Conditional assembly directives (`IFND/ENDC`, `IFD/ENDC`, `IFDEF/ENDC`, `IFNDEF/ENDC`)
  - Block comments (`/*` to `*/`)
  - Manual regions (`; #region` and `; #endregion`)
- **Symbol Search**: Quickly find symbols using Ctrl+Shift+O

### 🛠️ Supported Features

- All M68K instruction sets (data movement, arithmetic, logical, branch, etc.)
- All addressing modes and size specifiers (.b, .w, .l)
- Assembler directives (ORG, EQU, DC, DS, SECTION, etc.)
- Macro definitions and usage
- Multiple comment styles (; and /\*\*/)
- Custom folding regions using `; #region` and `; #endregion`

## File Extensions

The extension automatically activates for files with these extensions:

- `.s` - Standard assembly files
- `.i` - Include files
- `.inc` - Include files
- `.asm` - Assembly files
- `.68k` - M68K specific files
- `.m68k` - M68K specific files

## Usage Examples

### Basic Assembly Code

```assembly
; M68K Assembly Example
    org $1000

; Constants
SCREEN_WIDTH    equ 320
SCREEN_HEIGHT   equ 200
BUFFER_SIZE     equ SCREEN_WIDTH*SCREEN_HEIGHT

; Main program
start:
    move.l  #BUFFER_SIZE,d0     ; Load buffer size
    lea     buffer,a0           ; Load buffer address
    bsr     clear_buffer        ; Call subroutine
    rts

; Subroutine
clear_buffer:
    clr.b   (a0)+              ; Clear byte and increment
    dbf     d0,clear_buffer    ; Loop until done
    rts

; Data section
    section data
buffer: ds.b    BUFFER_SIZE
```

### INCLUDE Directives and Cross-File Navigation

- Use `INCLUDE "filename.inc"` to include symbols, macros, and definitions from other files.
- The extension recursively parses all included files, so you can Go to Definition, Find References, and Hover
  across your entire project—even through chains of includes.
- Include paths are resolved in this order:
  1. Relative to the current file
  2. Relative to the project root
  3. Using a fallback path specified in `m68kasmconfig.json`
- Both `/` and `\\` are supported in include paths for cross-platform compatibility.

### Hover Information

Hover over any instruction to see:

- Instruction description and syntax
- Cycle timing information
  - Base cycle counts
  - Additional cycles for different addressing modes
  - Timing variations for special cases
- Example usage

### Go to Definition

- Click on any label or constant while holding Ctrl to jump to its definition
- Works across the entire file and all included files

### Find References

- Right-click on a symbol and select "Find All References"
- See all locations where a symbol is used

### Rename Symbol

- Right-click on a user-defined symbol and select "Rename Symbol"
- All references will be updated automatically

## Installation

1. Clone or download this extension
2. Install dependencies: `npm install`
3. Compile: `npm run compile`
4. Press F5 to open a new VS Code window with the extension loaded
5. Open a .s, .asm, .68k, or .m68k file to activate the extension

## Development

### Building

```bash
npm install
npm run compile
```

### Development Testing

Open the extension in VS Code and press F5 to launch a new Extension Development Host window.

### Error Handling

The extension uses standardized error handling patterns:

```typescript
import { M68kErrorHandler, M68kError, ErrorSeverity } from './errorHandler';

// Wrap operations with error handling
const result = await M68kErrorHandler.withErrorHandling(
    async () => {
        // Your operation here
        return await parseFile(filePath);
    },
    {
        operation: 'file-parsing',
        file: filePath
    }
);

// Create specific error types
const fileError = M68kErrorHandler.createFileError(
    'Cannot read file',
    filePath,
    { operation: 'file-parsing' }
);
```

**Error Handling Features:**

- **Standardized Error Types**: Consistent error classification and handling
- **Contextual Information**: Rich error context with file, line, and operation details
- **Automatic Logging**: Errors are automatically logged with appropriate severity
- **User Notifications**: Critical errors show user-friendly notifications
- **Performance Monitoring**: Error tracking for performance optimization

## Configuration

### VS Code Settings

The extension can be configured through VS Code settings:

- `m68kAsm.enableHover`: Enable/disable hover information (default: true)
- `m68kAsm.enableGoToDefinition`: Enable/disable go to definition (default: true)

### Project Configuration (m68kasmconfig.json)

Create a `m68kasmconfig.json` file in your project root to configure project-specific settings:

```json
{
  "includeFallbackPath": "./include",
  "enableIntelliSense": true,
  "enableHover": true,
  "enableGoToDefinition": true,
  "enableReferences": true,
  "enableRename": true,
  "enableFolding": true,
  "cacheTimeout": 30,
  "maxCacheSize": 100,
  "logLevel": "info"
}
```

#### Configuration Options

- **`includeFallbackPath`**: Default path to search for include files when not found relative to current file
- **`enableIntelliSense`**: Master switch for all IntelliSense features
- **`enableHover`**: Enable hover information for instructions and symbols
- **`enableGoToDefinition`**: Enable go-to-definition functionality
- **`enableReferences`**: Enable find-all-references functionality
- **`enableRename`**: Enable symbol renaming functionality
- **`enableFolding`**: Enable code folding functionality
- **`cacheTimeout`**: Cache expiry time in seconds (default: 30)
- **`maxCacheSize`**: Maximum number of files to cache (default: 100)
- **`logLevel`**: Logging verbosity: "debug", "info", "warn", "error" (default: "info")

### Performance Features

#### File and Symbol Caching

The extension includes a comprehensive caching system that significantly improves performance:

- **File Content Caching**: Frequently accessed files are cached in memory with automatic expiry
- **Symbol Caching**: Parsed symbols are cached and automatically invalidated when files change
- **Smart Cache Management**: Automatic cleanup of expired entries and memory management
- **Cache Statistics**: Debug information available through logging for performance optimization

#### Configuration Validation

The extension automatically validates your `m68kasmconfig.json` configuration:

- **Structure Validation**: Ensures all properties have correct types
- **Path Validation**: Warns about non-existent include paths
- **Value Range Checking**: Validates numeric values are within reasonable ranges
- **Unknown Property Detection**: Warns about unrecognized configuration options

## Supported Instructions

The extension provides hover documentation for all standard M68K instructions including:

- **Data Movement**: MOVE, MOVEA, MOVEM, MOVEP, MOVEQ, LEA, PEA, SWAP, EXG
- **Arithmetic**: ADD, ADDA, ADDI, ADDQ, ADDX, SUB, SUBA, SUBI, SUBQ, SUBX, MULS, MULU, DIVS, DIVU, NEG, NEGX, CLR, EXT
- **Logical**: AND, ANDI, OR, ORI, EOR, EORI, NOT
- **Shift/Rotate**: ASL, ASR, LSL, LSR, ROL, ROR, ROXL, ROXR
- **Compare**: CMP, CMPA, CMPI, CMPM, TST
- **Branch**: BRA, BSR, Bcc (all condition codes)
- **Jump**: JMP, JSR, RTS, RTR, RTE
- **Bit Manipulation**: BTST, BSET, BCLR, BCHG
- **System**: TRAP, TRAPV, CHK, STOP, RESET, NOP, ILLEGAL

## Testing

The extension includes a comprehensive test suite located in the `test/` directory:

```text
test/
├── run-all-tests.js          # Main test runner script
├── demos/                    # Demo assembly files and examples
├── fixtures/                 # Test data and fixture files
├── include-fix/              # Tests for include statement resolution
├── integration/              # Integration tests
├── unit/                     # Unit tests for individual components
└── verification/             # Verification and demo scripts
```

### Running Tests

```bash
# Run all tests
cd test
node run-all-tests.js

# Run verification scripts
cd test/verification
node verify-include-fix.js
```

### Recent Fixes

- ✅ **Include Statement Resolution**: Fixed path resolution bug for include statements with Windows-style backslashes
- ✅ **Cross-Platform Support**: Enhanced path handling for better Windows/Unix compatibility
- ✅ **Project Organization**: All test files properly organized into structured directories

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed information on how to contribute to this project.

## License

This extension is provided as-is for educational and development purposes.
