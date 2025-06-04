import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { getConfig } from './config';
import { M68kLogger } from './logger';

export function resolveIncludePath(includePath: string, baseDir: string, projectRoot: string, fallbackPath: string): string | null {
    // Normalize path separators for cross-platform compatibility
    const normalizedIncludePath = includePath.replace(/\\/g, '/');
    
    // Try paths in order of preference
    const searchPaths = [baseDir, projectRoot, fallbackPath];
    
    for (const searchDir of searchPaths) {
        const candidate = path.resolve(searchDir, normalizedIncludePath);
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    
    M68kLogger.logFailure(`Include file not found: "${includePath}"`);
    return null;
}

export function getProjectRoot(document: vscode.TextDocument): string {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) return path.dirname(document.uri.fsPath);
    const containing = wsFolders.find(f => document.uri.fsPath.startsWith(f.uri.fsPath));
    return containing ? containing.uri.fsPath : wsFolders[0].uri.fsPath;
}

export function getIncludeFallbackPath(projectRoot: string): string {
    const config = getConfig();
    
    if (config.includeFallbackPath) {
        const resolvedPath = path.isAbsolute(config.includeFallbackPath)
            ? config.includeFallbackPath
            : path.resolve(projectRoot, config.includeFallbackPath);
        
        // Only log warning if the resolved path doesn't exist
        if (!fs.existsSync(resolvedPath)) {
            M68kLogger.logWarning(`Configured fallback path does not exist: ${resolvedPath}`);
        }
        
        return resolvedPath;
    }
    
    return projectRoot;
}
