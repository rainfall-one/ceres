export interface ContentSyncConfig {
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
export interface SyncResult {
    success: boolean;
    changes: string[];
    errors: string[];
    timestamp: Date;
}
/**
 * Main service class for synchronizing content from the Ceres shared repository
 */
export declare class RainfallContentSyncService {
    private config;
    private git;
    constructor(config: ContentSyncConfig);
    /**
     * Initialize the content sync service
     * Sets up the local content directory and clones/initializes the repository
     */
    initialize(): Promise<void>;
    /**
     * Sync content from the remote Ceres repository
     * Pulls latest changes and updates local content
     */
    sync(): Promise<SyncResult>;
    /**
     * Push local changes back to the remote repository
     * Only works if autoCommit is enabled and there are changes to push
     */
    push(commitMessage?: string): Promise<SyncResult>;
    /**
     * Get the current sync status
     * Returns information about local vs remote state
     */
    getStatus(): Promise<{
        localBranch: string;
        remoteBranch: string;
        upToDate: boolean;
        hasLocalChanges: boolean;
        lastSync?: Date;
    }>;
    /**
     * Private helper methods
     */
    private isGitSubmodule;
    private initializeSubmodule;
    private initializeStandaloneClone;
    private applyPathFilters;
    private log;
}
//# sourceMappingURL=RainfallContentSyncService.d.ts.map