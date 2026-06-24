import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
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
