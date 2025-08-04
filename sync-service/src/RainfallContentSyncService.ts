import { promises as fs } from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

export interface ContentSyncConfig
{
  /**
   * Repository URL or local path to the Ceres shared content repository
   */
  ceresRepositoryUrl: string;
  
  /**
   * Local directory where shared content should be synchronized
   */
  localContentPath: string;
  
  /**
   * Git branch to sync from (default: 'main')
   */
  branch?: string;
  
  /**
   * Whether to perform automatic commits when syncing changes
   */
  autoCommit?: boolean;
  
  /**
   * Directories to include in sync (default: all)
   */
  includePaths?: string[];
  
  /**
   * Directories to exclude from sync
   */
  excludePaths?: string[];
  
  /**
   * Whether to enable verbose logging
   */
  verbose?: boolean;
}

export interface SyncResult
{
  success: boolean;
  changes: string[];
  errors: string[];
  timestamp: Date;
}

/**
 * Main service class for synchronizing content from the Ceres shared repository
 */
export class RainfallContentSyncService
{
  private config: Required<ContentSyncConfig>;
  private git: SimpleGit;

  constructor(config: ContentSyncConfig)
  {
    // Set defaults for optional config properties
    this.config = {
      branch: 'main',
      autoCommit: true,
      includePaths: [],
      excludePaths: ['.git', 'node_modules', '.DS_Store'],
      verbose: false,
      ...config
    };

    this.git = simpleGit();
    this.log = this.log.bind(this);
  }

  /**
   * Initialize the content sync service
   * Sets up the local content directory and clones/initializes the repository
   */
  async initialize(): Promise<void>
  {
    try
    {
      this.log('Initializing Rainfall Content Sync Service...');
      
      // Ensure local content directory exists
      await fsExtra.ensureDir(this.config.localContentPath);
      
      // Check if we're working with a Git submodule or standalone clone
      const isSubmodule = await this.isGitSubmodule(this.config.localContentPath);
      
      if (isSubmodule)
      {
        this.log('Detected Git submodule, initializing submodule...');
        await this.initializeSubmodule();
      }
      else
      {
        this.log('Setting up standalone repository clone...');
        await this.initializeStandaloneClone();
      }
      
      this.log('Content sync service initialized successfully');
    }
    catch (error)
    {
      throw new Error(`Failed to initialize content sync service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync content from the remote Ceres repository
   * Pulls latest changes and updates local content
   */
  async sync(): Promise<SyncResult>
  {
    const result: SyncResult = {
      success: false,
      changes: [],
      errors: [],
      timestamp: new Date()
    };

    try
    {
      this.log('Starting content synchronization...');
      
      // Navigate to the content directory
      const contentGit = simpleGit(this.config.localContentPath);
      
      // Pull latest changes
      this.log(`Pulling latest changes from ${this.config.branch} branch...`);
      const pullResult = await contentGit.pull('origin', this.config.branch);
      
      if (pullResult.files && pullResult.files.length > 0)
      {
        result.changes = pullResult.files;
        this.log(`Synchronized ${pullResult.files.length} files`);
      }
      else
      {
        this.log('No changes to synchronize');
      }
      
      // Copy filtered content if include/exclude paths are specified
      if (this.config.includePaths.length > 0 || this.config.excludePaths.length > 0)
      {
        await this.applyPathFilters();
      }
      
      result.success = true;
      this.log('Content synchronization completed successfully');
      
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during sync';
      result.errors.push(errorMessage);
      this.log(`Sync failed: ${errorMessage}`, true);
    }

    return result;
  }

  /**
   * Push local changes back to the remote repository
   * Only works if autoCommit is enabled and there are changes to push
   */
  async push(commitMessage?: string): Promise<SyncResult>
  {
    const result: SyncResult = {
      success: false,
      changes: [],
      errors: [],
      timestamp: new Date()
    };

    try
    {
      if (!this.config.autoCommit)
      {
        throw new Error('Push operation requires autoCommit to be enabled');
      }

      this.log('Checking for local changes to push...');
      
      const contentGit = simpleGit(this.config.localContentPath);
      const status = await contentGit.status();
      
      if (status.files.length === 0)
      {
        this.log('No local changes to push');
        result.success = true;
        return result;
      }

      // Add all changes
      await contentGit.add('.');
      
      // Commit changes
      const message = commitMessage || `Content sync update - ${new Date().toISOString()}`;
      await contentGit.commit(message);
      
      // Push to remote
      await contentGit.push('origin', this.config.branch);
      
      result.changes = status.files.map(file => file.path);
      result.success = true;
      
      this.log(`Pushed ${status.files.length} changes to remote repository`);
      
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during push';
      result.errors.push(errorMessage);
      this.log(`Push failed: ${errorMessage}`, true);
    }

    return result;
  }

  /**
   * Get the current sync status
   * Returns information about local vs remote state
   */
  async getStatus(): Promise<{
    localBranch: string;
    remoteBranch: string;
    upToDate: boolean;
    hasLocalChanges: boolean;
    lastSync?: Date;
  }>
  {
    try
    {
      const contentGit = simpleGit(this.config.localContentPath);
      const status = await contentGit.status();
      const branch = await contentGit.revparse(['--abbrev-ref', 'HEAD']);
      
      // Check if we're ahead/behind remote
      const remoteBranch = `origin/${this.config.branch}`;
      
      return {
        localBranch: branch,
        remoteBranch: remoteBranch,
        upToDate: status.ahead === 0 && status.behind === 0,
        hasLocalChanges: status.files.length > 0,
        lastSync: new Date() // TODO: Store this properly
      };
    }
    catch (error)
    {
      throw new Error(`Failed to get sync status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Private helper methods
   */
  
  private async isGitSubmodule(path: string): Promise<boolean>
  {
    try
    {
      const gitDir = await fs.readFile(`${path}/.git`, 'utf8');
      return gitDir.trim().startsWith('gitdir:');
    }
    catch
    {
      return false;
    }
  }

  private async initializeSubmodule(): Promise<void>
  {
    // For submodules, we just need to ensure they're initialized and updated
    const parentGit = simpleGit(path.dirname(this.config.localContentPath));
    await parentGit.submoduleInit();
    await parentGit.submoduleUpdate();
  }

  private async initializeStandaloneClone(): Promise<void>
  {
    const isEmpty = (await fs.readdir(this.config.localContentPath)).length === 0;
    
    if (isEmpty)
    {
      // Clone the repository
      this.log(`Cloning repository from ${this.config.ceresRepositoryUrl}...`);
      await this.git.clone(this.config.ceresRepositoryUrl, this.config.localContentPath);
    }
    else
    {
      // Directory exists, ensure it's a git repository
      const contentGit = simpleGit(this.config.localContentPath);
      try
      {
        await contentGit.status();
      }
      catch
      {
        throw new Error('Local content directory exists but is not a git repository');
      }
    }
  }

  private async applyPathFilters(): Promise<void>
  {
    // Implementation for copying only specific paths based on include/exclude rules
    // This would be used for more granular control over what content gets synchronized
    this.log('Applying path filters... (implementation pending)');
  }

  private log(message: string, isError = false): void
  {
    if (this.config.verbose || isError)
    {
      const timestamp = new Date().toISOString();
      const prefix = isError ? '[ERROR]' : '[INFO]';
      console.log(`${timestamp} ${prefix} ${message}`);
    }
  }
}
