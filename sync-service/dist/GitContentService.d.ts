export interface GitRepositoryInfo {
    branch: string;
    remote: string;
    lastCommit: {
        hash: string;
        message: string;
        author: string;
        date: Date;
    };
    status: {
        modified: string[];
        added: string[];
        deleted: string[];
        untracked: string[];
    };
}
/**
 * Service class for Git operations on the shared content repository
 */
export declare class GitContentService {
    private git;
    private repositoryPath;
    constructor(repositoryPath: string);
    /**
     * Get comprehensive repository information
     */
    getRepositoryInfo(): Promise<GitRepositoryInfo>;
    /**
     * Check if there are any uncommitted changes
     */
    hasUncommittedChanges(): Promise<boolean>;
    /**
     * Get the difference between local and remote branch
     */
    getBranchDifference(): Promise<{
        ahead: number;
        behind: number;
        upToDate: boolean;
    }>;
    /**
     * Create a backup branch before making changes
     */
    createBackupBranch(branchName?: string): Promise<string>;
    /**
     * Reset repository to a specific commit or branch
     */
    resetToCommit(commitHash: string, hard?: boolean): Promise<void>;
    /**
     * Get the file changes between two commits
     */
    getFileChanges(fromCommit: string, toCommit: string): Promise<{
        modified: string[];
        added: string[];
        deleted: string[];
    }>;
    /**
     * Verify repository integrity
     */
    verifyRepository(): Promise<{
        isValid: boolean;
        issues: string[];
    }>;
    /**
     * Clean up repository (remove untracked files, reset changes)
     */
    cleanup(options?: {
        removeUntracked?: boolean;
        resetChanges?: boolean;
    }): Promise<void>;
}
//# sourceMappingURL=GitContentService.d.ts.map