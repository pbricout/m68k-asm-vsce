import * as path from 'path';
import * as fs from 'fs';
import { M68kLogger } from './logger';

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
    
    if (!configPath) {
        cachedConfig = cfg;
        return;
    }
    
    if (!fs.existsSync(configPath)) {
        cachedConfig = cfg;
        return;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        cfg = JSON.parse(configContent);
        M68kLogger.logSuccess(`Config loaded from: ${configPath}`);
    } catch (error) {
        M68kLogger.error(`Failed to load config from: ${configPath}`, error);
    }
    
    cachedConfig = cfg;
}

export function watchConfig(onReload: () => void) {
    if (!configPath) {
        return;
    }
    
    fs.watchFile(configPath, { interval: 500 }, () => {
        M68kLogger.log(`Config file changed, reloading...`);
        loadConfig();
        onReload();
    });
}

export function getConfig(): M68kAsmConfig {
    return cachedConfig;
}
