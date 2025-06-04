"use strict";
exports.__esModule = true;
exports.getIncludeFallbackPath = exports.getProjectRoot = exports.resolveIncludePath = void 0;
var path = require("path");
var fs = require("fs");
var vscode = require("vscode");
var config_1 = require("./config");
var logger_1 = require("./logger");
function resolveIncludePath(includePath, baseDir, projectRoot, fallbackPath) {
    // Normalize path separators for cross-platform compatibility
    var normalizedIncludePath = includePath.replace(/\\/g, '/');
    // Try paths in order of preference
    var searchPaths = [baseDir, projectRoot, fallbackPath];
    for (var _i = 0, searchPaths_1 = searchPaths; _i < searchPaths_1.length; _i++) {
        var searchDir = searchPaths_1[_i];
        var candidate = path.resolve(searchDir, normalizedIncludePath);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    logger_1.M68kLogger.logFailure("Include file not found: \"".concat(includePath, "\""));
    return null;
}
exports.resolveIncludePath = resolveIncludePath;
function getProjectRoot(document) {
    var wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders)
        return path.dirname(document.uri.fsPath);
    var containing = wsFolders.find(function (f) { return document.uri.fsPath.startsWith(f.uri.fsPath); });
    return containing ? containing.uri.fsPath : wsFolders[0].uri.fsPath;
}
exports.getProjectRoot = getProjectRoot;
function getIncludeFallbackPath(projectRoot) {
    var config = (0, config_1.getConfig)();
    if (config.includeFallbackPath) {
        var resolvedPath = path.isAbsolute(config.includeFallbackPath)
            ? config.includeFallbackPath
            : path.resolve(projectRoot, config.includeFallbackPath);
        // Only log warning if the resolved path doesn't exist
        if (!fs.existsSync(resolvedPath)) {
            logger_1.M68kLogger.logWarning("Configured fallback path does not exist: ".concat(resolvedPath));
        }
        return resolvedPath;
    }
    return projectRoot;
}
exports.getIncludeFallbackPath = getIncludeFallbackPath;
