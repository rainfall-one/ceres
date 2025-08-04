#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const GitContentService_1 = require("./GitContentService");
const RainfallContentSyncService_1 = require("./RainfallContentSyncService");
const program = new commander_1.Command();
// Package info for CLI
program
    .name('ceres-sync')
    .description('CLI tool for synchronizing Ceres shared content')
    .version('1.0.0');
/**
 * Initialize command - sets up content sync in a project
 */
program
    .command('init')
    .description('Initialize content sync in the current project')
    .option('-r, --repo <repository>', 'Ceres repository URL', 'https://github.com/rainfall-one/ceres.git')
    .option('-p, --path <path>', 'Local path for shared content', './shared-content')
    .option('-b, --branch <branch>', 'Git branch to sync from', 'main')
    .option('--submodule', 'Initialize as Git submodule instead of standalone clone')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🌧️  Initializing Rainfall Content Sync...'));
        const config = {
            ceresRepositoryUrl: options.repo,
            localContentPath: path.resolve(options.path),
            branch: options.branch,
            verbose: true
        };
        if (options.submodule) {
            console.log(chalk_1.default.yellow('Adding Ceres as Git submodule...'));
            const { exec } = await Promise.resolve().then(() => __importStar(require('child_process')));
            const { promisify } = await Promise.resolve().then(() => __importStar(require('util')));
            const execAsync = promisify(exec);
            await execAsync(`git submodule add ${options.repo} ${options.path}`);
            await execAsync('git submodule init');
            await execAsync('git submodule update');
            console.log(chalk_1.default.green('✅ Git submodule added successfully'));
        }
        else {
            const syncService = new RainfallContentSyncService_1.RainfallContentSyncService(config);
            await syncService.initialize();
            console.log(chalk_1.default.green('✅ Content sync initialized successfully'));
        }
        // Create config file
        const configPath = '.ceres-sync.json';
        await fs.writeJson(configPath, config, { spaces: 2 });
        console.log(chalk_1.default.green(`✅ Configuration saved to ${configPath}`));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Initialization failed:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
});
/**
 * Sync command - synchronizes content from remote
 */
program
    .command('sync')
    .description('Synchronize content from the remote repository')
    .option('-c, --config <path>', 'Path to config file', '.ceres-sync.json')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔄 Synchronizing content...'));
        // Load configuration
        const config = await loadConfig(options.config);
        if (options.verbose) {
            config.verbose = true;
        }
        const syncService = new RainfallContentSyncService_1.RainfallContentSyncService(config);
        const result = await syncService.sync();
        if (result.success) {
            if (result.changes.length > 0) {
                console.log(chalk_1.default.green(`✅ Synchronized ${result.changes.length} files:`));
                result.changes.forEach(file => console.log(chalk_1.default.gray(`  - ${file}`)));
            }
            else {
                console.log(chalk_1.default.green('✅ Content is already up to date'));
            }
        }
        else {
            console.error(chalk_1.default.red('❌ Synchronization failed:'));
            result.errors.forEach(error => console.error(chalk_1.default.red(`  - ${error}`)));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Sync failed:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
});
/**
 * Status command - shows current sync status
 */
program
    .command('status')
    .description('Show current synchronization status')
    .option('-c, --config <path>', 'Path to config file', '.ceres-sync.json')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('📊 Checking sync status...'));
        // Load configuration
        const config = await loadConfig(options.config);
        const syncService = new RainfallContentSyncService_1.RainfallContentSyncService(config);
        const gitService = new GitContentService_1.GitContentService(config.localContentPath);
        const [status, repoInfo] = await Promise.all([
            syncService.getStatus(),
            gitService.getRepositoryInfo()
        ]);
        console.log(chalk_1.default.bold('\n📁 Repository Information:'));
        console.log(`  Branch: ${chalk_1.default.cyan(status.localBranch)}`);
        console.log(`  Remote: ${chalk_1.default.gray(repoInfo.remote)}`);
        console.log(`  Last Commit: ${chalk_1.default.yellow(repoInfo.lastCommit.hash.substring(0, 8))} - ${repoInfo.lastCommit.message}`);
        console.log(`  Author: ${repoInfo.lastCommit.author}`);
        console.log(`  Date: ${repoInfo.lastCommit.date.toLocaleString()}`);
        console.log(chalk_1.default.bold('\n🔄 Sync Status:'));
        console.log(`  Up to Date: ${status.upToDate ? chalk_1.default.green('Yes') : chalk_1.default.red('No')}`);
        console.log(`  Local Changes: ${status.hasLocalChanges ? chalk_1.default.yellow('Yes') : chalk_1.default.green('No')}`);
        if (repoInfo.status.modified.length > 0) {
            console.log(chalk_1.default.yellow('\n📝 Modified Files:'));
            repoInfo.status.modified.forEach(file => console.log(`  - ${file}`));
        }
        if (repoInfo.status.untracked.length > 0) {
            console.log(chalk_1.default.yellow('\n📄 Untracked Files:'));
            repoInfo.status.untracked.forEach(file => console.log(`  - ${file}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Status check failed:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
});
/**
 * Push command - pushes local changes to remote
 */
program
    .command('push')
    .description('Push local changes to the remote repository')
    .option('-c, --config <path>', 'Path to config file', '.ceres-sync.json')
    .option('-m, --message <message>', 'Commit message')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('⬆️  Pushing changes...'));
        // Load configuration
        const config = await loadConfig(options.config);
        const syncService = new RainfallContentSyncService_1.RainfallContentSyncService(config);
        const result = await syncService.push(options.message);
        if (result.success) {
            if (result.changes.length > 0) {
                console.log(chalk_1.default.green(`✅ Pushed ${result.changes.length} changes:`));
                result.changes.forEach(file => console.log(chalk_1.default.gray(`  - ${file}`)));
            }
            else {
                console.log(chalk_1.default.green('✅ No changes to push'));
            }
        }
        else {
            console.error(chalk_1.default.red('❌ Push failed:'));
            result.errors.forEach(error => console.error(chalk_1.default.red(`  - ${error}`)));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Push failed:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
});
/**
 * Verify command - verifies repository integrity
 */
program
    .command('verify')
    .description('Verify repository integrity and configuration')
    .option('-c, --config <path>', 'Path to config file', '.ceres-sync.json')
    .action(async (options) => {
    try {
        console.log(chalk_1.default.blue('🔍 Verifying repository...'));
        // Load configuration
        const config = await loadConfig(options.config);
        const gitService = new GitContentService_1.GitContentService(config.localContentPath);
        const verification = await gitService.verifyRepository();
        if (verification.isValid) {
            console.log(chalk_1.default.green('✅ Repository verification passed'));
        }
        else {
            console.log(chalk_1.default.red('❌ Repository verification failed:'));
            verification.issues.forEach(issue => console.log(chalk_1.default.red(`  - ${issue}`)));
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Verification failed:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
});
/**
 * Helper function to load configuration
 */
async function loadConfig(configPath) {
    try {
        if (!await fs.pathExists(configPath)) {
            throw new Error(`Configuration file not found: ${configPath}. Run 'ceres-sync init' first.`);
        }
        const config = await fs.readJson(configPath);
        // Validate required properties
        if (!config.ceresRepositoryUrl || !config.localContentPath) {
            throw new Error('Invalid configuration: missing required properties');
        }
        return config;
    }
    catch (error) {
        throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
// Parse command line arguments
program.parse();
//# sourceMappingURL=cli.js.map