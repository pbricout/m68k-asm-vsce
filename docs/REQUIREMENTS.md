# M68K Assembly Language Support Extension - Requirements Document

## Overview

This document defines the functional and technical requirements for the M68K Assembly Language Support extension for Visual Studio Code. The extension provides comprehensive language support for Motorola 68000 (M68K) assembly language programming.

## 1. Language Recognition and File Support

### 1.1 File Extensions

The extension must automatically activate for files with the following extensions:

- `.s` - Standard assembly files
- `.i` - Include files  
- `.inc` - Include files
- `.asm` - Assembly files
- `.68k` - M68K specific files
- `.m68k` - M68K specific files

### 1.2 Language Identification

- Language ID: `m68k-asm`
- Language aliases: "M68K Assembly", "m68k-asm", "68k"
- Scope name: `source.m68k-asm`

## 2. Syntax Highlighting

### 2.1 Core Assembly Elements

The extension must provide syntax highlighting for:

- **Instructions**: All M68K instruction mnemonics (MOVE, ADD, SUB, etc.)
- **Size specifiers**: `.b` (byte), `.w` (word), `.l` (long)
- **Registers**: Data registers (D0-D7), Address registers (A0-A7), Special registers (SP, PC, SR, CCR, USP, SSP)
- **Addressing modes**: All M68K addressing modes including immediate, direct, indirect, etc.
- **Numbers**: Hexadecimal ($FFFF), binary (%1010), octal (@777), decimal (123)
- **Strings**: Double-quoted and single-quoted strings
- **Labels**: User-defined labels and constants
- **Comments**: Line comments (`;`) and block comments (`/* */`)
- **Directives**: Assembler directives (ORG, EQU, DC, DS, SECTION, etc.)

### 2.2 Advanced Highlighting

- **Macro definitions**: MACRO to ENDM blocks
- **Conditional assembly**: IF/ENDIF, IFDEF/IFNDEF blocks
- **Local labels**: Labels starting with `.` (dot)
- **Constants**: EQU-defined constants
- **Include statements**: INCLUDE directive with file paths

## 3. IntelliSense Features

### 3.1 Hover Information

**Requirements:**
- Display detailed information when hovering over any supported element
- Show instruction descriptions, syntax, and cycle timing information
- Display register descriptions for M68K registers
- Show symbol definitions for user-defined labels and constants
- Include file path and line number for symbol definitions

**Implementation:**
- Hover provider must implement `vscode.HoverProvider`
- Support for instructions, registers, directives, and user symbols
- Context-aware timing information based on addressing modes
- Cross-file symbol resolution through include chains

### 3.2 Go to Definition

**Requirements:**
- Navigate to symbol definitions with Ctrl+Click or F12
- Support for labels, constants (EQU), and macro definitions
- Cross-file navigation through INCLUDE statements
- Navigate to included files when clicking on include paths

**Implementation:**
- Definition provider must implement `vscode.DefinitionProvider`
- Resolve symbols across multiple files and include chains
- Handle local label scoping (visible only between global labels)
- Return `vscode.Location` with file URI and position

### 3.3 Find All References

**Requirements:**
- Find all occurrences of labels, constants, and user-defined symbols
- Search across all files in the project including included files
- Exclude false positives (e.g., instruction mnemonics, registers)
- Respect local label scoping rules

**Implementation:**
- Reference provider must implement `vscode.ReferenceProvider`
- Return array of `vscode.Location` objects
- Include context information for each reference

### 3.4 Rename Symbol

**Requirements:**
- Safely rename user-defined symbols (labels, constants)
- Update all references across the project
- Validate new symbol names according to assembly syntax rules
- Respect local label scoping

**Implementation:**
- Rename provider must implement `vscode.RenameProvider`
- Implement `prepareRename` for validation
- Return `vscode.WorkspaceEdit` with all necessary changes

## 4. Code Navigation

### 4.1 Document Outline

**Requirements:**
- Display hierarchical view of symbols in the current document
- Show labels, constants, macros, and sections
- Enable quick navigation to symbols

**Implementation:**
- Symbol provider must implement `vscode.DocumentSymbolProvider`
- Return `vscode.DocumentSymbol` array with appropriate symbol kinds
- Support nested symbols (e.g., labels within sections)

### 4.2 Code Folding

**Requirements:**
- Fold sections (SECTION, BSS, DATA, TEXT)
- Fold macro definitions (MACRO to ENDM)
- Fold conditional blocks (IF to ENDIF)
- Fold conditional assembly directives (IFND/ENDC, IFD/ENDC, IFDEF/ENDC, IFNDEF/ENDC)
- Fold block comments (`/* */`)
- Support manual regions (`; #region` and `; #endregion`)

**Implementation:**
- Folding provider must implement `vscode.FoldingRangeProvider`
- Return `vscode.FoldingRange` array with appropriate folding kinds
- Support regex-based folding markers in language configuration

## 5. M68K Assembly Language Support

### 5.1 Instruction Set

**Requirements:**
- Support complete M68000 instruction set
- All data movement instructions (MOVE, MOVEA, MOVEM, etc.)
- All arithmetic instructions (ADD, SUB, MUL, DIV, etc.)
- All logical instructions (AND, OR, EOR, NOT, etc.)
- All shift and rotate instructions (ASL, ASR, LSL, LSR, ROL, ROR, etc.)
- All branch and jump instructions (BRA, BEQ, BNE, JMP, JSR, etc.)
- All bit manipulation instructions (BSET, BCLR, BCHG, BTST, etc.)
- All system control instructions (RTS, RTR, RTE, NOP, etc.)

### 5.2 Addressing Modes

**Requirements:**
- Data register direct (Dn)
- Address register direct (An)
- Address register indirect ((An))
- Address register indirect with postincrement ((An)+)
- Address register indirect with predecrement (-(An))
- Address register indirect with displacement (d(An))
- Immediate (#data)
- Absolute short ($nnnn)
- Absolute long ($nnnnnnnn)
- Program counter relative (d(PC))

### 5.3 Assembler Directives

**Requirements:**
- **ORG**: Set origin address
- **EQU**: Equate symbol to value
- **DC**: Define constant (.b, .w, .l)
- **DS**: Define storage (.b, .w, .l)
- **DCB**: Define constant block
- **EVEN**: Align to even address
- **ALIGN**: Align to boundary
- **INCLUDE**: Include file
- **INCBIN**: Include binary file
- **MACRO/ENDM**: Macro definition
- **SECTION**: Define sections (TEXT, DATA, BSS)

### 5.4 Comment Styles

**Requirements:**
- Line comments starting with `;`
- Block comments `/* */`
- Support for comments starting with `*` (planned feature)

## 6. Include System

### 6.1 Include Resolution

**Requirements:**
- Support INCLUDE directive for file inclusion
- Resolve include paths in the following order:
  1. Relative to the current file
  2. Relative to the project root
  3. Using fallback path from configuration
- Support both `/` and `\` path separators for cross-platform compatibility
- Recursive parsing of included files
- Prevention of circular includes

### 6.2 Cross-File Features

**Requirements:**
- All language features must work across included files
- Symbol resolution through include chains
- Go to Definition for symbols in included files
- Find References across all included files
- Hover information for symbols from included files

## 7. Configuration

### 7.1 VS Code Settings

**Requirements:**
- `m68kAsm.enableHover`: Enable/disable hover information (default: true)
- `m68kAsm.enableGoToDefinition`: Enable/disable go to definition (default: true)

### 7.2 Project Configuration

**Requirements:**
- Support for `m68kasmconfig.json` in project root
- Configuration options for include fallback paths
- Future support for multiple fallback paths (array configuration)

## 8. Performance Requirements

### 8.1 Response Time

- Hover information: < 100ms
- Go to Definition: < 200ms
- Find References: < 500ms for typical projects
- Symbol parsing: < 1s for files up to 10,000 lines

### 8.2 Memory Usage

- Efficient caching of parsed symbols
- Lazy loading of included files
- Memory cleanup for closed documents

## 9. Error Handling

### 9.1 Graceful Degradation

**Requirements:**
- Extension must not crash on malformed assembly code
- Provide meaningful error messages for configuration issues
- Continue functioning when some files are inaccessible
- Log errors without breaking user workflow

### 9.2 Logging

**Requirements:**
- Structured logging system for debugging
- Different log levels (info, warning, error)
- Output channel for user-accessible logs

## 10. Editor Integration

### 10.1 Language Configuration

**Requirements:**
- Auto-closing pairs for brackets and quotes
- Appropriate word boundaries for assembly syntax
- Comment toggling support
- Bracket matching

### 10.2 Commands

**Requirements:**
- `m68kAsm.restartLanguageServer`: Restart language services
- `m68kAsm.showOutput`: Show extension output logs

## 11. Symbol Scoping Rules

### 11.1 Global Labels

**Requirements:**
- Labels without leading dot are global
- Visible throughout the file and included files
- Can be referenced from anywhere in the project

### 11.2 Local Labels

**Requirements:**
- Labels starting with `.` (dot) are local
- Visible only between two global labels
- Only one instance allowed per global label section
- All language features must respect local scoping

### 11.3 Constants

**Requirements:**
- EQU-defined symbols are global by default
- Can be referenced from anywhere in the project
- Support for different value types (numeric, string, expression)

## 12. Cycle Timing Information

### 12.1 Instruction Timing

**Requirements:**
- Display cycle counts for M68K instructions
- Context-aware timing based on addressing modes
- Show read/write cycle breakdown
- Support for variable timing (ranges)

### 12.2 Timing Display

**Requirements:**
- Base cycle counts for each instruction
- Additional cycles for addressing modes
- Special cases (e.g., MOVEM with register count)
- Clear format: "cycles(read/write)"

## 13. Testing Requirements

### 13.1 Unit Tests

**Requirements:**
- Test all language providers individually
- Test symbol resolution logic
- Test include path resolution
- Test regex patterns for syntax elements

### 13.2 Integration Tests

**Requirements:**
- Test cross-file navigation
- Test complete include chains
- Test large project performance
- Test edge cases and error conditions

## 14. Known Issues and Planned Features

### 14.1 Current Bugs

- Include system needs debugging and improvement
- Syntax highlighting requires fixes
- Better support for local labels needed
- F12 navigation should ignore instruction mnemonics and registers

### 14.2 Planned Features

- Multiple fallback paths in configuration
- Comment block folding
- Support for asterisk (`*`) comments  
- Code block folding (global label to global label)
- Output directive support
- Enhanced cycle count support
- Special handling for labels ending with `\@`

## 15. Compatibility

### 15.1 VS Code Version

- Minimum VS Code version: 1.74.0
- Compatible with latest VS Code versions

### 15.2 Platform Support

- Windows, macOS, and Linux
- Cross-platform path handling
- Consistent behavior across operating systems

This requirements document serves as the definitive specification for the M68K Assembly Language Support extension, ensuring all features are properly documented and their intended behavior is clearly defined.
