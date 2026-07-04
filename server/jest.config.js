// Two lanes:
//  - unit: pure-function tests (test/analytics/**), no DB, no setup file.
//    Run alone via `npm run test:unit` - safe with no DATABASE_URL at all.
//  - integration: everything else; keeps the jest.setup.js DB reset and
//    must stay serialized (--runInBand) against the shared staging DB.
module.exports = {
  projects: [
    {
      displayName: "unit",
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/analytics/**/*.test.js"],
    },
    {
      displayName: "integration",
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/**/*.test.js"],
      testPathIgnorePatterns: ["/node_modules/", "<rootDir>/test/analytics/"],
      setupFilesAfterEnv: ["<rootDir>/test/jest.setup.js"],
    },
  ],
};
