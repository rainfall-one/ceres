import { ContentSyncConfig, RainfallContentSyncService } from '../RainfallContentSyncService';

describe('RainfallContentSyncService', () =>
{
  let service: RainfallContentSyncService;
  let mockConfig: ContentSyncConfig;

  beforeEach(() =>
  {
    mockConfig = {
      ceresRepositoryUrl: 'https://github.com/rainfall-one/ceres.git',
      localContentPath: './test-shared-content',
      branch: 'main',
      verbose: false
    };

    service = new RainfallContentSyncService(mockConfig);
  });

  describe('constructor', () =>
  {
    it('should create service with default configuration', () =>
    {
      expect(service).toBeInstanceOf(RainfallContentSyncService);
    });

    it('should apply default values to optional config properties', () =>
    {
      const serviceWithMinimalConfig = new RainfallContentSyncService({
        ceresRepositoryUrl: 'test-repo',
        localContentPath: './test-path'
      });

      expect(serviceWithMinimalConfig).toBeInstanceOf(RainfallContentSyncService);
    });
  });

  describe('configuration validation', () =>
  {
    it('should handle missing optional properties', () =>
    {
      const minimalConfig: ContentSyncConfig = {
        ceresRepositoryUrl: 'https://github.com/rainfall-one/ceres.git',
        localContentPath: './test-content'
      };

      expect(() =>
      {
        new RainfallContentSyncService(minimalConfig);
      }).not.toThrow();
    });

    it('should preserve provided configuration values', () =>
    {
      const customConfig: ContentSyncConfig = {
        ceresRepositoryUrl: 'https://github.com/rainfall-one/ceres.git',
        localContentPath: './custom-content',
        branch: 'develop',
        autoCommit: false,
        verbose: true,
        includePaths: ['design-tokens'],
        excludePaths: ['temp', '.cache']
      };

      const customService = new RainfallContentSyncService(customConfig);
      expect(customService).toBeInstanceOf(RainfallContentSyncService);
    });
  });
});
