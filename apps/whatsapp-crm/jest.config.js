'use strict';

module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/**/*.test.js'],
  rootDir: 'tests',
  modulePaths: ['<rootDir>/..'],
  clearMocks: true,
  resetModules: true,
};
