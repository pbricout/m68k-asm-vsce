import * as vscode from 'vscode';
import { M68kDefinitionProvider } from './definitionProvider';
import { M68kReferenceProvider } from './referenceProvider';
import { M68kRenameProvider } from './renameProvider';
import { M68kHoverProvider } from './hoverProvider';
import { M68kDocumentSymbolProvider } from './symbolProvider';
import { setConfigPath, loadConfig, watchConfig } from './config';
import { M68kLogger } from './logger';
import * as path from 'path';
import * as fs from 'fs';

export function activate(context: vscode.ExtensionContext) {
    M68kLogger.log('Extension activating...');
    M68kLogger.info('M68K Assembly extension logs are now available in the "M68K Assembly" output channel');
    M68kLogger.info('Use "M68K Assembly: Show Output" command to view logs');
    
    // Setup config path and load config once at startup
    const wsFolders = vscode.workspace.workspaceFolders;
    const projectRoot = wsFolders && wsFolders.length > 0 ? wsFolders[0].uri.fsPath : process.cwd();
    M68kLogger.log(`Project root determined as: ${projectRoot}`);
    
    setConfigPath(projectRoot);
    loadConfig();
      // Watch for config file changes and reload
    watchConfig(() => {
        M68kLogger.log('Config file changed - reloading extension configuration');
    });

    M68kLogger.log('Registering language providers...');

    const selector: vscode.DocumentSelector = { language: 'm68k-asm', scheme: 'file' };

    // Register definition provider
    context.subscriptions.push(
        vscode.languages.registerDefinitionProvider(selector, new M68kDefinitionProvider())
    );

    // Register reference provider
    context.subscriptions.push(
        vscode.languages.registerReferenceProvider(selector, new M68kReferenceProvider())
    );

    // Register rename provider
    context.subscriptions.push(
        vscode.languages.registerRenameProvider(selector, new M68kRenameProvider())
    );

    // Register hover provider
    context.subscriptions.push(
        vscode.languages.registerHoverProvider(selector, new M68kHoverProvider())
    );

    // Register document symbol provider for outline
    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(selector, new M68kDocumentSymbolProvider())
    );

    // Register folding range provider for custom folding
    context.subscriptions.push(
        vscode.languages.registerFoldingRangeProvider(selector, new M68kFoldingProvider())    );    // Register restart language server command
    context.subscriptions.push(
        vscode.commands.registerCommand('m68kAsm.restartLanguageServer', () => {
            M68kLogger.log('Restart command executed');
            vscode.window.showInformationMessage('Restarting M68K Assembly extension (reloading window)...');
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        })
    );

    // Register show output command
    context.subscriptions.push(
        vscode.commands.registerCommand('m68kAsm.showOutput', () => {
            M68kLogger.log('Show output command executed');
            M68kLogger.show();
        })
    );

    M68kLogger.logSuccess('Extension activated successfully');
}

export function deactivate() {
    M68kLogger.log('Extension deactivating...');
    M68kLogger.dispose();
}

class M68kFoldingProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(document: vscode.TextDocument): vscode.FoldingRange[] {
        const ranges: vscode.FoldingRange[] = [];
        const lines = document.getText().split('\n');
        let regionStart: number | null = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Handle region folding
            if (line.match(/^;\s*#region\b/i)) {
                regionStart = i;
            } else if (line.match(/^;\s*#endregion\b/i) && regionStart !== null) {
                ranges.push(new vscode.FoldingRange(regionStart, i));
                regionStart = null;
            }
            // Handle macro folding
            if (line.match(/^\s*\w+\s+macro\b/i)) {
                const macroStart = i;
                for (let j = i + 1; j < lines.length; j++) {
                    if (lines[j].trim().match(/^\s*endm\b/i)) {
                        ranges.push(new vscode.FoldingRange(macroStart, j));
                        break;
                    }
                }
            }
            // Handle multi-line comments
            const blockCommentStart = line.indexOf('/*');
            if (blockCommentStart !== -1) {
                for (let j = i; j < lines.length; j++) {
                    if (lines[j].indexOf('*/') !== -1) {
                        if (j > i) {
                            ranges.push(new vscode.FoldingRange(i, j));
                        }
                        break;
                    }
                }
            }
        }
        return ranges;
    }
}