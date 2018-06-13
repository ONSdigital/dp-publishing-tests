module.exports = {
    name: "ONS publishing platform acceptance tests",
    preset: "jest-puppeteer",
    verbose: true,
    bail: false,
    globalSetup: "./setup.js",
    globalTeardown: "./teardown.js",
    testEnvironment: "./environment.js"
};