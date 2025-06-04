import * as path from 'path';
import * as fs from 'fs';

export interface M68kAsmConfig {
    includeFallbackPath?: string;
}

let cachedConfig: M68kAsmConfig = {};
let configPath: string | null = null;

export function setConfigPath(projectRoot: string) {
    configPath = path.join(projectRoot, 'm68kasmconfig.json');
}

export function loadConfig() {
    let cfg: M68kAsmConfig = {};
    if (configPath && fs.existsSync(configPath)) {
        try {
            cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch {}
    }
    cachedConfig = cfg;
}

export function watchConfig(onReload: () => void) {
    if (!configPath) return;
    fs.watchFile(configPath, { interval: 500 }, () => {
        loadConfig();
        onReload();
    });
}

export function getConfig(): M68kAsmConfig {
    return cachedConfig;
}
