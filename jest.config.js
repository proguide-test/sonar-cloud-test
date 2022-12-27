// eslint-disable-next-line no-undef
module.exports = {
  preset: 'ts-jest',
  testEnvironment: "node",
  collectCoverage: true,
  testResultsProcessor: "jest-sonar-reporter",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/src/carrito/",
    "/src/producto/",
    "/test/",
  ],
  coverageThreshold: {
    global: {
      lines: 10
    }
  },
  coverageReporters: ["clover", "json", "lcov", 'text', 'cobertura'],
  setupFilesAfterEnv: ['./jest.setup.js']
};