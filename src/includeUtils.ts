import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { getConfig } from './config';
import { M68kLogger } from './logger';

export function resolveIncludePath(includePath: string, baseDir: string, projectRoot: string, fallbackPath: string): string | null {
    // Clean up the include path by removing quotes and trimming
    const cleanPath = includePath.replace(/['"]/g, '').trim();
    
    // Try paths in order of preference
    const searchPaths = [baseDir, projectRoot, fallbackPath];
    
    for (const searchDir of searchPaths) {
        // Use path.resolve to handle cross-platform path resolution
        // This will automatically handle backslashes on Windows and forward slashes on Unix
        const candidate = path.resolve(searchDir, cleanPath);
        
        M68kLogger.log(`Checking include path: "${searchDir}" + "${cleanPath}" = "${candidate}"`);
        
        if (fs.existsSync(candidate)) {
            M68kLogger.logSuccess(`Include file found: "${candidate}"`);
            return candidate;
        }
    }
    
    // Additional logging for debugging
    M68kLogger.logFailure(`Include file not found: "${cleanPath}"`);
    M68kLogger.log(`Search paths tried: ${searchPaths.join(', ')}`);
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
