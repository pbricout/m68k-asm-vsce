# Contributing to M68K Assembly Language Support

Thank you for your interest in contributing to the M68K Assembly Language Support extension for VS Code!
This document provides guidelines and information for contributors.

## How to Contribute

Contributions are welcome! Please feel free to submit issues and pull requests.

## Development Setup

### Prerequisites

- Node.js (latest LTS version recommended)
- Visual Studio Code
- Git

### Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd m68K-assembly-extension
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Build the extension**

   ```bash
   npm run compile
   ```

4. **Launch development environment**
   - Press `F5` in VS Code to open a new Extension Development Host window
   - Open a `.s`, `.asm`, `.68k`, or `.m68k` file to activate the extension

## Project Structure

### Key Components

- **`src/extension.ts`**: Extension entry point that handles activation and registers providers
- **Language Features**:
  - `HoverProvider`: Shows documentation for instructions, registers, and user symbols
  - `DefinitionProvider`: Handles "Go to Definition" for labels and constants
  - `ReferenceProvider`: Finds all references to symbols
  - `RenameProvider`: Safely renames user-defined symbols
  - `SymbolProvider`: Provides document symbols for outline view
  - `FoldingProvider`: Implements code folding for sections, macros, etc.
- **Configuration Files**:
  - `language-configuration.json`: Defines editor behaviors (comments, brackets, etc.)
  - `syntaxes/m68k-asm.tmLanguage.json`: TextMate grammar for syntax highlighting
  - `package.json`: Extension manifest with metadata and contributions

### Testing Structure

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

Example error handling pattern:

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
```

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
- Follow markdownlint rules (DavidAnson.vscode-markdownlint):
  - MD001: Headers must use proper incrementing levels
  - MD003: Headers must use consistent style (ATX style with no closing #)
  - MD004: Unordered lists must use consistent markers (-)
  - MD009: No trailing spaces
  - MD010: No hard tabs, use spaces
  - MD012: Multiple blank lines should be collapsed into one
  - MD013: Line length should be no more than 120 characters
  - MD014: Dollar signs not allowed before shell commands
  - MD018/MD019: Must have space after hash in headers
  - MD022: Headers must be surrounded by blank lines
  - MD023: Headers must start at the beginning of the line
  - MD024: No duplicate header titles in the same section
  - MD025: Only one top-level header
  - MD026: No trailing punctuation in headers
  - MD027: Multiple spaces after blockquote symbol
  - MD029: Ordered list items should use incremental numbers
  - MD030: Space after list markers
  - MD031: Fenced code blocks should be surrounded by blank lines
  - MD032: Lists should be surrounded by blank lines
  - MD033: No inline HTML (except for allowed tags)
  - MD034: Bare URLs should be enclosed in angles brackets
  - MD037: Spaces around emphasis markers
  - MD038: Spaces around code span markers
  - MD039: Spaces inside link text
  - MD040: Fenced code blocks should have a language specified
  - MD041: First line should be top-level header
  - MD047: Files should end with a single newline character

### Testing

- Test new features thoroughly
- Cover edge cases in assembly syntax
- Validate symbol resolution
- Check performance with large files

#### Testing Utilities

The extension includes comprehensive testing utilities in `src/testUtils.ts`:

```typescript
import { TestDataGenerator, PerformanceTester, createTestParseContext } from './testUtils';

// Generate test project structure
const testProject = TestDataGenerator.generateTestProject('/tmp/test-project');

// Test file parsing
const symbols = await parseTestFile(testProject.mainFile);

// Performance testing
const perfTester = new PerformanceTester();
perfTester.startTiming();
// ... perform operations ...
const duration = perfTester.endTiming('parse-operation');
```

**Available Testing Features:**

- **Project Generation**: Automatically create complete test projects with includes, macros, and labels
- **File Utilities**: Create test assembly files, include files, and configuration files
- **Symbol Validation**: Validate symbol properties and assert symbol existence
- **Performance Testing**: Measure and track operation performance with statistics
- **Cache Testing**: Utilities to test caching functionality and performance

### Running Tests

```bash
# Run all tests
cd test
node run-all-tests.js

# Run verification scripts
cd test/verification
node verify-include-fix.js
```

## Stable Changes

### General Principles

1. **Deterministic Edits**
   - Every change should be reproducible
   - Use exact pattern matching over fuzzy matching
   - Prefer tools over manual edits
   - Document the exact transformation applied
   - One logical change per commit

2. **Minimal Impact**
   - Change only what needs to be changed
   - Preserve existing patterns and styles
   - Keep original content where possible
   - Avoid cascading modifications
   - Respect existing formatting decisions

3. **Predictable Locations**
   - Make changes in well-defined locations
   - Use absolute references (line numbers, exact matches)
   - Include context in changes (3-5 lines before/after)
   - Document the selection criteria
   - Make changes atomic and isolated

### Implementation Guidelines

1. **Finding Locations**
   - Use exact string matches
   - Include surrounding context
   - Search for unique patterns
   - Verify match uniqueness
   - Document search criteria

2. **Making Changes**
   - Use replace_string_in_file for exact replacements
   - Use insert_edit_into_file for partial changes
   - Keep original indentation
   - Maintain line endings
   - Preserve comment styles

3. **Command Line Usage**
   - Use long-form options over short-form (e.g., --file instead of -f)
   - Prefer explicit option names for clarity
   - Document command options in comments when complex
   - Maintain consistency in option style across scripts
   - Consider tool-specific conventions when they differ

4. **Validation**
   - Verify change was applied correctly
   - Check for unintended side effects
   - Run relevant linters
   - Test affected functionality
   - Document verification steps

## Version Control

### Commit Guidelines

Follow Conventional Commits format:

```bash
type(scope): description

[optional body]

[optional footer(s)]
```

- **Types**: feat, fix, docs, style, refactor, perf, test, build, ci
- **Scope**: hover, syntax, parser, etc.
- **Description**: present tense, concise, under 72 chars
- **Breaking changes**: Add ! after type or BREAKING CHANGE in footer

### Release Process

1. **Version Management**
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Automated version bumping with `npm run release:[type]`
   - Generate changelog from commits
   - Create git tags automatically

2. **Quality Checks**
   - All tests pass
   - No linting errors
   - Documentation updated
   - Examples reflect changes

3. **Publication**
   - Update version numbers
   - Create release tag
   - Generate release notes
   - Update marketplace listing

## Documentation Structure

- **Development documentations** (status, process, fixes, todo, etc) are located in `docs/dev/`
- **Reference documentations** (68000 cycles, assembler manual, etc.) are located in `docs/references/`

## Getting Help

If you have questions or need help with contributing:

1. Check existing issues in the repository
2. Create a new issue with detailed information
3. Follow the project's coding guidelines and conventions

Thank you for contributing to the M68K Assembly Language Support extension!
