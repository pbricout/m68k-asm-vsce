import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { getConfig } from './config';

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

export function getProjectRoot(document: vscode.TextDocument): string {
    const wsFolders = vscode.workspace.workspaceFolders;
    if (!wsFolders) return path.dirname(document.uri.fsPath);
    const containing = wsFolders.find(f => document.uri.fsPath.startsWith(f.uri.fsPath));
    return containing ? containing.uri.fsPath : wsFolders[0].uri.fsPath;
}

export function getIncludeFallbackPath(projectRoot: string): string {
    const config = getConfig();
    if (config.includeFallbackPath) {
        return path.isAbsolute(config.includeFallbackPath)
            ? config.includeFallbackPath
            : path.resolve(projectRoot, config.includeFallbackPath);
    }
    return projectRoot;
}
