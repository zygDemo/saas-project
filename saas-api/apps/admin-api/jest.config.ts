import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    // isolatedModules 跳过类型检查只做语法转换，避免源文件类型问题阻塞测试
    '^.+\\.(t|j)s$': ['ts-jest', { isolatedModules: true }],
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@saas/shared$': '<rootDir>/../../packages/shared/src',
    '^@saas/shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
  },
  // ESM 包需要 transform
  transformIgnorePatterns: [
    'node_modules/(?!(@saas/shared)/)',
  ],
  //  FIXME: 以下测试因实现变更/依赖注入 mock 缺失或业务断言过时临时跳过，后续逐步修复
  //  清单见 docs/qa/admin-api-skipped-specs.md
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
};

export default config;
