import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

/**
 * Resolves an INCLUDE path using the same logic as the language providers.
 * Tries relative to baseDir, then projectRoot, then fallbackPath, supporting both / and \\.
 */
export function resolveIncludePath(includePath: string, baseDir: string, projectRoot: string, fallbackPath: string): string | null {
    let candidate = path.resolve(baseDir, includePath);
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(baseDir, includePath.replace(/\\/g, '/'));
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(baseDir, includePath.replace(/\//g, '\\'));
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(projectRoot, includePath);
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(projectRoot, includePath.replace(/\\/g, '/'));
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(projectRoot, includePath.replace(/\//g, '\\'));
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(fallbackPath, includePath);
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(fallbackPath, includePath.replace(/\\/g, '/'));
    if (fs.existsSync(candidate)) return candidate;
    candidate = path.resolve(fallbackPath, includePath.replace(/\//g, '\\'));
    if (fs.existsSync(candidate)) return candidate;
    return null;
}

/**
 * Returns the project root for a given document.
 */
export function getProjectRoot(document: vscode.TextDocument): string {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) return path.dirname(document.uri.fsPath);
    const containing = wsFolders.find(f => document.uri.fsPath.startsWith(f.uri.fsPath));
    return containing ? containing.uri.fsPath : wsFolders[0].uri.fsPath;
}

/**
 * Returns the include fallback path from m68kasmconfig.json, supporting both absolute and relative paths.
 */
export function getIncludeFallbackPath(projectRoot: string): string {
    const configPath = path.join(projectRoot, 'm68kasmconfig.json');
    if (fs.existsSync(configPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (config.includeFallbackPath) {
                // If absolute, use as-is; if relative, resolve from project root
                return path.isAbsolute(config.includeFallbackPath)
                    ? config.includeFallbackPath
                    : path.resolve(projectRoot, config.includeFallbackPath);
            }
        } catch {}
    }
    return projectRoot;
}
