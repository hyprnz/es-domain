/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: ['default', 'jest-junit']
}

// Set environment variables required for integration tests here
//process.env.P8_B2CProvisioningApiToken=undefined
