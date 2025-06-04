"use strict";
exports.__esModule = true;
exports.deactivate = exports.activate = void 0;
var vscode = require("vscode");
var definitionProvider_1 = require("./definitionProvider");
var referenceProvider_1 = require("./referenceProvider");
var renameProvider_1 = require("./renameProvider");
var hoverProvider_1 = require("./hoverProvider");
var symbolProvider_1 = require("./symbolProvider");
var foldingProvider_1 = require("./foldingProvider");
var config_1 = require("./config");
var logger_1 = require("./logger");
function activate(context) {
    logger_1.M68kLogger.log('Extension activating...');
    logger_1.M68kLogger.info('M68K Assembly extension logs are now available in the "M68K Assembly" output channel');
    logger_1.M68kLogger.info('Use "M68K Assembly: Show Output" command to view logs');
    // Setup config path and load config once at startup
    var wsFolders = vscode.workspace.workspaceFolders;
    var projectRoot = wsFolders && wsFolders.length > 0 ? wsFolders[0].uri.fsPath : process.cwd();
    logger_1.M68kLogger.log("Project root determined as: ".concat(projectRoot));
    (0, config_1.setConfigPath)(projectRoot);
    (0, config_1.loadConfig)();
    // Watch for config file changes and reload
    (0, config_1.watchConfig)(function () {
        logger_1.M68kLogger.log('Config file changed - reloading extension configuration');
    });
    logger_1.M68kLogger.log('Registering language providers...');
    var selector = { language: 'm68k-asm', scheme: 'file' };
    // Register definition provider
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(selector, new definitionProvider_1.M68kDefinitionProvider()));
    // Register reference provider
    context.subscriptions.push(vscode.languages.registerReferenceProvider(selector, new referenceProvider_1.M68kReferenceProvider()));
    // Register rename provider
    context.subscriptions.push(vscode.languages.registerRenameProvider(selector, new renameProvider_1.M68kRenameProvider()));
    // Register hover provider
    context.subscriptions.push(vscode.languages.registerHoverProvider(selector, new hoverProvider_1.M68kHoverProvider()));
    // Register document symbol provider for outline
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(selector, new symbolProvider_1.M68kDocumentSymbolProvider()));
    // Register folding range provider for custom folding
    context.subscriptions.push(vscode.languages.registerFoldingRangeProvider(selector, new foldingProvider_1.M68kFoldingProvider())); // Register restart language server command
    context.subscriptions.push(vscode.commands.registerCommand('m68kAsm.restartLanguageServer', function () {
        logger_1.M68kLogger.log('Restart command executed');
        vscode.window.showInformationMessage('Restarting M68K Assembly extension (reloading window)...');
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }));
    // Register show output command
    context.subscriptions.push(vscode.commands.registerCommand('m68kAsm.showOutput', function () {
        logger_1.M68kLogger.log('Show output command executed');
        logger_1.M68kLogger.show();
    }));
    logger_1.M68kLogger.logSuccess('Extension activated successfully');
}
exports.activate = activate;
function deactivate() {
    logger_1.M68kLogger.log('Extension deactivating...');
    logger_1.M68kLogger.dispose();
}
exports.deactivate = deactivate;
