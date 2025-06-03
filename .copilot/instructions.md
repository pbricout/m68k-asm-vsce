# GitHub Copilot Instructions for M68K Assembly Extension

This document provides guidance for GitHub Copilot when working with this VS Code extension for M68K assembly language support.

## Project Overview

This is a Visual Studio Code extension that provides comprehensive language support for Motorola 68000 (M68K) assembly language. The extension includes features like syntax highlighting, IntelliSense, code navigation, and folding capabilities.

## Key Components

### Extension Entry Point (`src/extension.ts`)

- Handles extension activation
- Registers providers for language features (definitions, references, hover, etc.)
- Sets up document selectors for M68K assembly files

### Language Features

- `HoverProvider`: Shows documentation for instructions, registers, and user symbols
- `DefinitionProvider`: Handles "Go to Definition" for labels and constants
- `ReferenceProvider`: Finds all references to symbols
- `RenameProvider`: Safely renames user-defined symbols
- `SymbolProvider`: Provides document symbols for outline view
- `FoldingProvider`: Implements code folding for sections, macros, etc.

### Configuration Files

- `language-configuration.json`: Defines editor behaviors (comments, brackets, etc.)
- `syntaxes/m68k-asm.tmLanguage.json`: TextMate grammar for syntax highlighting
- `package.json`: Extension manifest with metadata and contributions

## Coding Guidelines

### Adding New Features

1. Follow TypeScript best practices and VS Code extension guidelines
2. Add new providers in `src/extension.ts` and register them
3. Update tests if adding new functionality
4. Document new features in README.md

### Modifying Language Support

1. Add new M68K instructions in:
   - `HoverProvider` instruction documentation
   - TextMate grammar patterns
2. Update symbol handling in definition/reference providers
3. Keep syntax highlighting rules consistent

### M68K Assembly Specifics

1. Support standard M68000 instruction set
2. Handle all addressing modes and size specifiers
3. Recognize standard assembler directives
4. Support macro definitions and expansions

### Error Handling

1. Use proper VS Code error handling
2. Validate user inputs in rename provider
3. Handle edge cases in symbol resolution
4. Add error messages in proper formats

## Best Practices

### Code Organization

- Keep providers in separate files
- Use consistent naming conventions
- Follow VS Code extension patterns

### Performance

- Use efficient regex patterns
- Cache parsed documents when possible
- Avoid unnecessary document parsing

### Documentation

- Update README.md for new features
- Use JSDoc comments for functions
- Document complex regex patterns
- Keep hover documentation concise

### Testing

- Test new features thoroughly
- Cover edge cases in assembly syntax
- Validate symbol resolution
- Check performance with large files
