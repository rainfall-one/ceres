"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitContentService = void 0;
const simple_git_1 = __importDefault(require("simple-git"));
/**
 * Service class for Git operations on the shared content repository
 */
class GitContentService {
    constructor(repositoryPath) {
        this.repositoryPath = repositoryPath;
        this.git = (0, simple_git_1.default)(repositoryPath);
    }
    /**
     * Get comprehensive repository information
     */
    async getRepositoryInfo() {
        try {
            const [branch, remotes, log, status] = await Promise.all([
                this.git.revparse(['--abbrev-ref', 'HEAD']),
                this.git.getRemotes(true),
                this.git.log({ maxCount: 1 }),
                this.git.status()
            ]);
            const remote = remotes.find(r => r.name === 'origin')?.refs?.fetch || 'unknown';
            const lastCommit = log.latest;
            return {
                branch,
                remote,
                lastCommit: {
                    hash: lastCommit?.hash || '',
                    message: lastCommit?.message || '',
                    author: lastCommit?.author_name || '',
                    date: lastCommit?.date ? new Date(lastCommit.date) : new Date()
                },
                status: {
                    modified: status.modified,
                    added: status.created,
                    deleted: status.deleted,
                    untracked: status.not_added
                }
            };
        }
        catch (error) {
            throw new Error(`Failed to get repository info: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check if there are any uncommitted changes
     */
    async hasUncommittedChanges() {
        try {
            const status = await this.git.status();
            return status.files.length > 0;
        }
        catch (error) {
            throw new Error(`Failed to check for uncommitted changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get the difference between local and remote branch
     */
    async getBranchDifference() {
        try {
            await this.git.fetch();
            const status = await this.git.status();
            return {
                ahead: status.ahead || 0,
                behind: status.behind || 0,
                upToDate: (status.ahead || 0) === 0 && (status.behind || 0) === 0
            };
        }
        catch (error) {
            throw new Error(`Failed to get branch difference: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Create a backup branch before making changes
     */
    async createBackupBranch(branchName) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupName = branchName || `backup-${timestamp}`;
            await this.git.checkoutBranch(backupName, 'HEAD');
            await this.git.checkout('main'); // Return to main branch
            return backupName;
        }
        catch (error) {
            throw new Error(`Failed to create backup branch: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Reset repository to a specific commit or branch
     */
    async resetToCommit(commitHash, hard = false) {
        try {
            if (hard) {
                await this.git.reset(['--hard', commitHash]);
            }
            else {
                await this.git.reset(['--soft', commitHash]);
            }
        }
        catch (error) {
            throw new Error(`Failed to reset to commit: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Get the file changes between two commits
     */
    async getFileChanges(fromCommit, toCommit) {
        try {
            const diff = await this.git.diffSummary([fromCommit, toCommit]);
            const modified = [];
            const added = [];
            const deleted = [];
            diff.files.forEach(file => {
                // Check if it's a text file with insertions/deletions properties
                if ('insertions' in file && 'deletions' in file) {
                    if (file.insertions > 0 && file.deletions > 0) {
                        modified.push(file.file);
                    }
                    else if (file.insertions > 0) {
                        added.push(file.file);
                    }
                    else if (file.deletions > 0) {
                        deleted.push(file.file);
                    }
                }
                else {
                    // For binary files or other types, we'll consider them modified
                    modified.push(file.file);
                }
            });
            return { modified, added, deleted };
        }
        catch (error) {
            throw new Error(`Failed to get file changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Verify repository integrity
     */
    async verifyRepository() {
        const issues = [];
        try {
            // Check if it's a git repository
            await this.git.status();
            // Check if remote exists
            const remotes = await this.git.getRemotes();
            if (remotes.length === 0) {
                issues.push('No remote repositories configured');
            }
            // Check if we can access the remote
            try {
                await this.git.fetch();
            }
            catch {
                issues.push('Cannot access remote repository');
            }
            return {
                isValid: issues.length === 0,
                issues
            };
        }
        catch (error) {
            issues.push(`Repository verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return {
                isValid: false,
                issues
            };
        }
    }
    /**
     * Clean up repository (remove untracked files, reset changes)
     */
    async cleanup(options = {}) {
        try {
            if (options.resetChanges) {
                await this.git.reset(['--hard', 'HEAD']);
            }
            if (options.removeUntracked) {
                await this.git.clean('f', ['-d']);
            }
        }
        catch (error) {
            throw new Error(`Failed to cleanup repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.GitContentService = GitContentService;
//# sourceMappingURL=GitContentService.js.map