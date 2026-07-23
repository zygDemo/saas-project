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
};

export default config;
