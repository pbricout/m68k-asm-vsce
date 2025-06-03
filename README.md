# M68K Assembly Language Support for VS Code

A comprehensive Visual Studio Code extension that provides full language support for Motorola 68000 (M68K) assembly language programming.

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
- **Hover Information**: Get detailed information about instructions, registers, and symbols

### 📁 Code Navigation

- **Document Outline**: View all labels, constants, macros, and sections in the outline
- **Folding**: Support for region folding, macro folding, and comment block folding
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

### Hover Information

Hover over any instruction to see:

- Instruction description
- Syntax information
- Usage examples

### Go to Definition

- Click on any label or constant while holding Ctrl to jump to its definition
- Works across the entire file

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

### Testing

Open the extension in VS Code and press F5 to launch a new Extension Development Host window.

## Configuration

The extension can be configured through VS Code settings:

- `m68kAsm.enableHover`: Enable/disable hover information (default: true)
- `m68kAsm.enableGoToDefinition`: Enable/disable go to definition (default: true)

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

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

This extension is provided as-is for educational and development purposes.