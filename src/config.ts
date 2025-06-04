import * as path from 'path';
import * as fs from 'fs';
import { M68kLogger } from './logger';

export interface M68kAsmConfig {
    includeFallbackPath?: string;
    // Additional configuration options
    enableIntelliSense?: boolean;
    enableHover?: boolean;
    enableGoToDefinition?: boolean;
    enableReferences?: boolean;
    enableRename?: boolean;
    enableFolding?: boolean;
    cacheTimeout?: number; // in seconds
    maxCacheSize?: number; // maximum number of cached files
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface ConfigValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

// Default configuration values
const DEFAULT_CONFIG: Required<M68kAsmConfig> = {
    includeFallbackPath: '',
    enableIntelliSense: true,
    enableHover: true,
    enableGoToDefinition: true,
    enableReferences: true,
    enableRename: true,
    enableFolding: true,
    cacheTimeout: 30,
    maxCacheSize: 100,
    logLevel: 'info'
};

let cachedConfig: M68kAsmConfig = {};
let configPath: string | null = null;
let projectRoot: string | null = null;
let lastValidationResult: ConfigValidationResult | null = null;

/**
 * Validates the configuration object structure and values
 */
export function validateConfig(config: any, projectRoot?: string): ConfigValidationResult {
    const result: ConfigValidationResult = {
        isValid: true,
        errors: [],
        warnings: []
    };

    if (typeof config !== 'object' || config === null) {
        result.errors.push('Configuration must be a valid JSON object');
        result.isValid = false;
        return result;
    }

    // Validate includeFallbackPath
    if (config.includeFallbackPath !== undefined) {
        if (typeof config.includeFallbackPath !== 'string') {
            result.errors.push('includeFallbackPath must be a string');
            result.isValid = false;
        } else if (config.includeFallbackPath && projectRoot) {
            // Resolve the path relative to the project root
            const resolvedPath = path.resolve(projectRoot, config.includeFallbackPath);
            if (!fs.existsSync(resolvedPath)) {
                result.warnings.push(`includeFallbackPath directory does not exist: ${config.includeFallbackPath} (resolved to: ${resolvedPath})`);
            }
        }
    }

    // Validate boolean properties
    const booleanProps = ['enableIntelliSense', 'enableHover', 'enableGoToDefinition', 'enableReferences', 'enableRename', 'enableFolding'];
    for (const prop of booleanProps) {
        if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
            result.errors.push(`${prop} must be a boolean value`);
            result.isValid = false;
        }
    }

    // Validate cacheTimeout
    if (config.cacheTimeout !== undefined) {
        if (typeof config.cacheTimeout !== 'number' || config.cacheTimeout < 0) {
            result.errors.push('cacheTimeout must be a non-negative number');
            result.isValid = false;
        } else if (config.cacheTimeout > 3600) {
            result.warnings.push('cacheTimeout is very high (>1 hour), consider a lower value for better performance');
        }
    }

    // Validate maxCacheSize
    if (config.maxCacheSize !== undefined) {
        if (typeof config.maxCacheSize !== 'number' || config.maxCacheSize < 1) {
            result.errors.push('maxCacheSize must be a positive number');
            result.isValid = false;
        } else if (config.maxCacheSize > 1000) {
            result.warnings.push('maxCacheSize is very high (>1000), this may consume significant memory');
        }
    }

    // Validate logLevel
    if (config.logLevel !== undefined) {
        const validLogLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLogLevels.includes(config.logLevel)) {
            result.errors.push(`logLevel must be one of: ${validLogLevels.join(', ')}`);
            result.isValid = false;
        }
    }

    // Check for unknown properties
    const knownProps = Object.keys(DEFAULT_CONFIG);
    const unknownProps = Object.keys(config).filter(prop => !knownProps.includes(prop));
    if (unknownProps.length > 0) {
        result.warnings.push(`Unknown configuration properties: ${unknownProps.join(', ')}`);
    }

    return result;
}

/**
 * Merges user configuration with default values
 */
export function mergeWithDefaults(config: M68kAsmConfig): Required<M68kAsmConfig> {
    return {
        ...DEFAULT_CONFIG,
        ...config
    };
}

export function setConfigPath(projectRootPath: string) {
    projectRoot = projectRootPath;
    configPath = path.join(projectRootPath, 'm68kasmconfig.json');
}

export function loadConfig() {
    let cfg: M68kAsmConfig = {};
    
    if (!configPath) {
        cachedConfig = cfg;
        lastValidationResult = null;
        return;
    }
    
    if (!fs.existsSync(configPath)) {
        cachedConfig = cfg;
        lastValidationResult = null;
        return;
    }
    
    try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const parsedConfig = JSON.parse(configContent);
          // Validate the configuration
        const validationResult = validateConfig(parsedConfig, projectRoot || undefined);
        lastValidationResult = validationResult;
        
        if (validationResult.isValid) {
            cfg = parsedConfig;
            M68kLogger.logSuccess(`Config loaded and validated from: ${configPath}`);
            
            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                validationResult.warnings.forEach(warning => 
                    M68kLogger.warn(`Config warning: ${warning}`)
                );
            }
        } else {
            M68kLogger.error(`Config validation failed for: ${configPath}`);
            validationResult.errors.forEach(error => 
                M68kLogger.error(`Config error: ${error}`)
            );
            
            // Use empty config on validation failure
            cfg = {};
        }
    } catch (error) {
        M68kLogger.error(`Failed to load config from: ${configPath}`, error);
        lastValidationResult = {
            isValid: false,
            errors: [`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: []
        };
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

/**
 * Gets the merged configuration with default values
 */
export function getConfigWithDefaults(): Required<M68kAsmConfig> {
    return mergeWithDefaults(cachedConfig);
}

/**
 * Gets the last configuration validation result
 */
export function getLastValidationResult(): ConfigValidationResult | null {
    return lastValidationResult;
}

/**
 * Creates a sample configuration file with documentation
 */
export function createSampleConfig(targetPath: string): void {
    const sampleConfig = {
        // Include fallback path for when files are not found in the current directory
        "includeFallbackPath": "./include",
        
        // Language server features
        "enableIntelliSense": true,
        "enableHover": true,
        "enableGoToDefinition": true,
        "enableReferences": true,
        "enableRename": true,
        "enableFolding": true,
        
        // Performance settings
        "cacheTimeout": 30,
        "maxCacheSize": 100,
        
        // Logging level (debug, info, warn, error)
        "logLevel": "info"
    };
    
    const configJson = JSON.stringify(sampleConfig, null, 2);
    const configWithComments = `// M68K Assembly Language Extension Configuration
// This file configures various aspects of the M68K assembly language support
${configJson}`;
    
    fs.writeFileSync(targetPath, configWithComments, 'utf8');
}
