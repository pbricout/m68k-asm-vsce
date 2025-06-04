"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.createSampleConfig = exports.getLastValidationResult = exports.getConfigWithDefaults = exports.getConfig = exports.watchConfig = exports.loadConfig = exports.setConfigPath = exports.mergeWithDefaults = exports.validateConfig = void 0;
var path = require("path");
var fs = require("fs");
var logger_1 = require("./logger");
// Default configuration values
var DEFAULT_CONFIG = {
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
var cachedConfig = {};
var configPath = null;
var lastValidationResult = null;
/**
 * Validates the configuration object structure and values
 */
function validateConfig(config) {
    var result = {
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
        }
        else if (config.includeFallbackPath && !fs.existsSync(config.includeFallbackPath)) {
            result.warnings.push("includeFallbackPath directory does not exist: ".concat(config.includeFallbackPath));
        }
    }
    // Validate boolean properties
    var booleanProps = ['enableIntelliSense', 'enableHover', 'enableGoToDefinition', 'enableReferences', 'enableRename', 'enableFolding'];
    for (var _i = 0, booleanProps_1 = booleanProps; _i < booleanProps_1.length; _i++) {
        var prop = booleanProps_1[_i];
        if (config[prop] !== undefined && typeof config[prop] !== 'boolean') {
            result.errors.push("".concat(prop, " must be a boolean value"));
            result.isValid = false;
        }
    }
    // Validate cacheTimeout
    if (config.cacheTimeout !== undefined) {
        if (typeof config.cacheTimeout !== 'number' || config.cacheTimeout < 0) {
            result.errors.push('cacheTimeout must be a non-negative number');
            result.isValid = false;
        }
        else if (config.cacheTimeout > 3600) {
            result.warnings.push('cacheTimeout is very high (>1 hour), consider a lower value for better performance');
        }
    }
    // Validate maxCacheSize
    if (config.maxCacheSize !== undefined) {
        if (typeof config.maxCacheSize !== 'number' || config.maxCacheSize < 1) {
            result.errors.push('maxCacheSize must be a positive number');
            result.isValid = false;
        }
        else if (config.maxCacheSize > 1000) {
            result.warnings.push('maxCacheSize is very high (>1000), this may consume significant memory');
        }
    }
    // Validate logLevel
    if (config.logLevel !== undefined) {
        var validLogLevels = ['debug', 'info', 'warn', 'error'];
        if (!validLogLevels.includes(config.logLevel)) {
            result.errors.push("logLevel must be one of: ".concat(validLogLevels.join(', ')));
            result.isValid = false;
        }
    }
    // Check for unknown properties
    var knownProps = Object.keys(DEFAULT_CONFIG);
    var unknownProps = Object.keys(config).filter(function (prop) { return !knownProps.includes(prop); });
    if (unknownProps.length > 0) {
        result.warnings.push("Unknown configuration properties: ".concat(unknownProps.join(', ')));
    }
    return result;
}
exports.validateConfig = validateConfig;
/**
 * Merges user configuration with default values
 */
function mergeWithDefaults(config) {
    return __assign(__assign({}, DEFAULT_CONFIG), config);
}
exports.mergeWithDefaults = mergeWithDefaults;
function setConfigPath(projectRoot) {
    configPath = path.join(projectRoot, 'm68kasmconfig.json');
}
exports.setConfigPath = setConfigPath;
function loadConfig() {
    var cfg = {};
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
        var configContent = fs.readFileSync(configPath, 'utf8');
        var parsedConfig = JSON.parse(configContent);
        // Validate the configuration
        var validationResult = validateConfig(parsedConfig);
        lastValidationResult = validationResult;
        if (validationResult.isValid) {
            cfg = parsedConfig;
            logger_1.M68kLogger.logSuccess("Config loaded and validated from: ".concat(configPath));
            // Log warnings if any
            if (validationResult.warnings.length > 0) {
                validationResult.warnings.forEach(function (warning) {
                    return logger_1.M68kLogger.warn("Config warning: ".concat(warning));
                });
            }
        }
        else {
            logger_1.M68kLogger.error("Config validation failed for: ".concat(configPath));
            validationResult.errors.forEach(function (error) {
                return logger_1.M68kLogger.error("Config error: ".concat(error));
            });
            // Use empty config on validation failure
            cfg = {};
        }
    }
    catch (error) {
        logger_1.M68kLogger.error("Failed to load config from: ".concat(configPath), error);
        lastValidationResult = {
            isValid: false,
            errors: ["JSON parsing error: ".concat(error instanceof Error ? error.message : 'Unknown error')],
            warnings: []
        };
    }
    cachedConfig = cfg;
}
exports.loadConfig = loadConfig;
function watchConfig(onReload) {
    if (!configPath) {
        return;
    }
    fs.watchFile(configPath, { interval: 500 }, function () {
        logger_1.M68kLogger.log("Config file changed, reloading...");
        loadConfig();
        onReload();
    });
}
exports.watchConfig = watchConfig;
function getConfig() {
    return cachedConfig;
}
exports.getConfig = getConfig;
/**
 * Gets the merged configuration with default values
 */
function getConfigWithDefaults() {
    return mergeWithDefaults(cachedConfig);
}
exports.getConfigWithDefaults = getConfigWithDefaults;
/**
 * Gets the last configuration validation result
 */
function getLastValidationResult() {
    return lastValidationResult;
}
exports.getLastValidationResult = getLastValidationResult;
/**
 * Creates a sample configuration file with documentation
 */
function createSampleConfig(targetPath) {
    var sampleConfig = {
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
    var configJson = JSON.stringify(sampleConfig, null, 2);
    var configWithComments = "// M68K Assembly Language Extension Configuration\n// This file configures various aspects of the M68K assembly language support\n".concat(configJson);
    fs.writeFileSync(targetPath, configWithComments, 'utf8');
}
exports.createSampleConfig = createSampleConfig;
