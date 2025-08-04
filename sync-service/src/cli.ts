#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import { GitContentService } from './GitContentService';
import { ContentSyncConfig, RainfallContentSyncService } from './RainfallContentSyncService';

const program = new Command();

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
  .action(async (options) =>
  {
    try
    {
      console.log(chalk.blue('🌧️  Initializing Rainfall Content Sync...'));
      
      const config: ContentSyncConfig = {
        ceresRepositoryUrl: options.repo,
        localContentPath: path.resolve(options.path),
        branch: options.branch,
        verbose: true
      };
      
      if (options.submodule)
      {
        console.log(chalk.yellow('Adding Ceres as Git submodule...'));
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);
        
        await execAsync(`git submodule add ${options.repo} ${options.path}`);
        await execAsync('git submodule init');
        await execAsync('git submodule update');
        
        console.log(chalk.green('✅ Git submodule added successfully'));
      }
      else
      {
        const syncService = new RainfallContentSyncService(config);
        await syncService.initialize();
        console.log(chalk.green('✅ Content sync initialized successfully'));
      }
      
      // Create config file
      const configPath = '.ceres-sync.json';
      await fs.writeJson(configPath, config, { spaces: 2 });
      console.log(chalk.green(`✅ Configuration saved to ${configPath}`));
      
    }
    catch (error)
    {
      console.error(chalk.red('❌ Initialization failed:'), error instanceof Error ? error.message : 'Unknown error');
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
  .action(async (options) =>
  {
    try
    {
      console.log(chalk.blue('🔄 Synchronizing content...'));
      
      // Load configuration
      const config = await loadConfig(options.config);
      if (options.verbose)
      {
        config.verbose = true;
      }
      
      const syncService = new RainfallContentSyncService(config);
      const result = await syncService.sync();
      
      if (result.success)
      {
        if (result.changes.length > 0)
        {
          console.log(chalk.green(`✅ Synchronized ${result.changes.length} files:`));
          result.changes.forEach(file => console.log(chalk.gray(`  - ${file}`)));
        }
        else
        {
          console.log(chalk.green('✅ Content is already up to date'));
        }
      }
      else
      {
        console.error(chalk.red('❌ Synchronization failed:'));
        result.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
      }
      
    }
    catch (error)
    {
      console.error(chalk.red('❌ Sync failed:'), error instanceof Error ? error.message : 'Unknown error');
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
  .action(async (options) =>
  {
    try
    {
      console.log(chalk.blue('📊 Checking sync status...'));
      
      // Load configuration
      const config = await loadConfig(options.config);
      
      const syncService = new RainfallContentSyncService(config);
      const gitService = new GitContentService(config.localContentPath);
      
      const [status, repoInfo] = await Promise.all([
        syncService.getStatus(),
        gitService.getRepositoryInfo()
      ]);
      
      console.log(chalk.bold('\n📁 Repository Information:'));
      console.log(`  Branch: ${chalk.cyan(status.localBranch)}`);
      console.log(`  Remote: ${chalk.gray(repoInfo.remote)}`);
      console.log(`  Last Commit: ${chalk.yellow(repoInfo.lastCommit.hash.substring(0, 8))} - ${repoInfo.lastCommit.message}`);
      console.log(`  Author: ${repoInfo.lastCommit.author}`);
      console.log(`  Date: ${repoInfo.lastCommit.date.toLocaleString()}`);
      
      console.log(chalk.bold('\n🔄 Sync Status:'));
      console.log(`  Up to Date: ${status.upToDate ? chalk.green('Yes') : chalk.red('No')}`);
      console.log(`  Local Changes: ${status.hasLocalChanges ? chalk.yellow('Yes') : chalk.green('No')}`);
      
      if (repoInfo.status.modified.length > 0)
      {
        console.log(chalk.yellow('\n📝 Modified Files:'));
        repoInfo.status.modified.forEach(file => console.log(`  - ${file}`));
      }
      
      if (repoInfo.status.untracked.length > 0)
      {
        console.log(chalk.yellow('\n📄 Untracked Files:'));
        repoInfo.status.untracked.forEach(file => console.log(`  - ${file}`));
      }
      
    }
    catch (error)
    {
      console.error(chalk.red('❌ Status check failed:'), error instanceof Error ? error.message : 'Unknown error');
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
  .action(async (options) =>
  {
    try
    {
      console.log(chalk.blue('⬆️  Pushing changes...'));
      
      // Load configuration
      const config = await loadConfig(options.config);
      
      const syncService = new RainfallContentSyncService(config);
      const result = await syncService.push(options.message);
      
      if (result.success)
      {
        if (result.changes.length > 0)
        {
          console.log(chalk.green(`✅ Pushed ${result.changes.length} changes:`));
          result.changes.forEach(file => console.log(chalk.gray(`  - ${file}`)));
        }
        else
        {
          console.log(chalk.green('✅ No changes to push'));
        }
      }
      else
      {
        console.error(chalk.red('❌ Push failed:'));
        result.errors.forEach(error => console.error(chalk.red(`  - ${error}`)));
        process.exit(1);
      }
      
    }
    catch (error)
    {
      console.error(chalk.red('❌ Push failed:'), error instanceof Error ? error.message : 'Unknown error');
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
  .action(async (options) =>
  {
    try
    {
      console.log(chalk.blue('🔍 Verifying repository...'));
      
      // Load configuration
      const config = await loadConfig(options.config);
      
      const gitService = new GitContentService(config.localContentPath);
      const verification = await gitService.verifyRepository();
      
      if (verification.isValid)
      {
        console.log(chalk.green('✅ Repository verification passed'));
      }
      else
      {
        console.log(chalk.red('❌ Repository verification failed:'));
        verification.issues.forEach(issue => console.log(chalk.red(`  - ${issue}`)));
        process.exit(1);
      }
      
    }
    catch (error)
    {
      console.error(chalk.red('❌ Verification failed:'), error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  });

/**
 * Helper function to load configuration
 */
async function loadConfig(configPath: string): Promise<ContentSyncConfig>
{
  try
  {
    if (!await fs.pathExists(configPath))
    {
      throw new Error(`Configuration file not found: ${configPath}. Run 'ceres-sync init' first.`);
    }
    
    const config = await fs.readJson(configPath);
    
    // Validate required properties
    if (!config.ceresRepositoryUrl || !config.localContentPath)
    {
      throw new Error('Invalid configuration: missing required properties');
    }
    
    return config;
  }
  catch (error)
  {
    throw new Error(`Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Parse command line arguments
program.parse();
