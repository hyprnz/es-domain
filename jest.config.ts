import type { Config } from "jest"

const config: Config = {
  testEnvironment: "node",
  verbose: true,

  projects: [
    {
      displayName: "micro",
      testMatch: ["<rootDir>/src/**/*.micro.ts"],
      preset: "ts-jest",
    },
    {
      displayName: "integration",
      testMatch: ["<rootDir>/src/**/*.integration.ts"],
      preset: "ts-jest",
      setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
      slowTestThreshold: 20000,
    },
  ],
}

export default config
