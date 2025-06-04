import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { getConfig } from './config';
import { M68kLogger } from './logger';

export function resolveIncludePath(includePath: string, baseDir: string, projectRoot: string, fallbackPath: string): string | null {
    M68kLogger.log(`Resolving include path: "${includePath}"`);
    M68kLogger.logProgress(`Base dir: ${baseDir}`);
    M68kLogger.logProgress(`Project root: ${projectRoot}`);
    M68kLogger.logProgress(`Fallback path: ${fallbackPath}`);
    
    // Try relative to base directory
    let candidate = path.resolve(baseDir, includePath);
    M68kLogger.logProgress(`Trying relative to base: ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    candidate = path.resolve(baseDir, includePath.replace(/\\/g, '/'));
    M68kLogger.logProgress(`Trying relative to base (forward slashes): ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    candidate = path.resolve(baseDir, includePath.replace(/\//g, '\\'));
    M68kLogger.logProgress(`Trying relative to base (backslashes): ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    // Try relative to project root
    candidate = path.resolve(projectRoot, includePath);
    M68kLogger.logProgress(`Trying relative to project root: ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    candidate = path.resolve(projectRoot, includePath.replace(/\\/g, '/'));
    M68kLogger.logProgress(`Trying relative to project root (forward slashes): ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    candidate = path.resolve(projectRoot, includePath.replace(/\//g, '\\'));
    M68kLogger.logProgress(`Trying relative to project root (backslashes): ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    // Try relative to fallback path
    candidate = path.resolve(fallbackPath, includePath);
    M68kLogger.logProgress(`Trying relative to fallback: ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    candidate = path.resolve(fallbackPath, includePath.replace(/\\/g, '/'));
    M68kLogger.logProgress(`Trying relative to fallback (forward slashes): ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
    }
    
    candidate = path.resolve(fallbackPath, includePath.replace(/\//g, '\\'));
    M68kLogger.logProgress(`Trying relative to fallback (backslashes): ${candidate}`);
    if (fs.existsSync(candidate)) {
        M68kLogger.logSuccess(`Found at: ${candidate}`);
        return candidate;
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
    M68kLogger.log(`Getting include fallback path for project root: ${projectRoot}`);
    
    if (config.includeFallbackPath) {
        const resolvedPath = path.isAbsolute(config.includeFallbackPath)
            ? config.includeFallbackPath
            : path.resolve(projectRoot, config.includeFallbackPath);
        
        M68kLogger.logProgress(`Config fallback path: ${config.includeFallbackPath}`);
        M68kLogger.logProgress(`Resolved fallback path: ${resolvedPath}`);
        
        // Validate the resolved path exists
        if (fs.existsSync(resolvedPath)) {
            M68kLogger.logSuccess(`Fallback path exists`);
        } else {
            M68kLogger.logWarning(`Fallback path does not exist: ${resolvedPath}`);
        }
        
        return resolvedPath;
    }
    
    M68kLogger.log(`No fallback path configured, using project root: ${projectRoot}`);
    return projectRoot;
}
