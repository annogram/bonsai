module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [ "src/**/*.{ts,js,jsx}" ],
  testMatch: [ "**/*.test.ts" ],
  coverageReporters: [
    "text",
    "lcov",
    "json",
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};