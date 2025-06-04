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
    M68kLogger.log(`Config path set to: ${configPath}`);
}

export function loadConfig() {
    let cfg: M68kAsmConfig = {};
    
    if (!configPath) {
        M68kLogger.log(`No config path set, using default configuration`);
        cachedConfig = cfg;
        return;
    }
    
    if (!fs.existsSync(configPath)) {
        M68kLogger.log(`Config file not found at: ${configPath}, using default configuration`);
        cachedConfig = cfg;
        return;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        cfg = JSON.parse(configContent);
        M68kLogger.logSuccess(`Config loaded successfully from: ${configPath}`);
        M68kLogger.log(`Config content:`, cfg);
        
        // Validate includeFallbackPath if specified
        if (cfg.includeFallbackPath) {
            validateIncludeFallbackPath(cfg.includeFallbackPath);
        }
    } catch (error) {
        M68kLogger.error(`Failed to load config from: ${configPath}`, error);
        M68kLogger.log(`Using default configuration due to config load error`);
    }
    
    cachedConfig = cfg;
}

function validateIncludeFallbackPath(fallbackPath: string) {
    const isAbsolute = path.isAbsolute(fallbackPath);
    M68kLogger.log(`Include fallback path validation:`);
    M68kLogger.logProgress(`Path: ${fallbackPath}`);
    M68kLogger.logProgress(`Is absolute: ${isAbsolute}`);
    
    // For absolute paths, check if they exist
    if (isAbsolute) {
        if (fs.existsSync(fallbackPath)) {
            M68kLogger.logSuccess(`Absolute path exists`);
        } else {
            M68kLogger.logWarning(`Absolute path does not exist: ${fallbackPath}`);
        }
    } else {
        M68kLogger.log(`Note: Relative path will be resolved against project root at runtime`);
    }
}

export function watchConfig(onReload: () => void) {
    if (!configPath) {
        M68kLogger.log(`No config path to watch`);
        return;
    }
    
    M68kLogger.log(`Starting to watch config file: ${configPath}`);
    fs.watchFile(configPath, { interval: 500 }, () => {
        M68kLogger.log(`Config file changed, reloading...`);
        loadConfig();
        onReload();
    });
}

export function getConfig(): M68kAsmConfig {
    return cachedConfig;
}
