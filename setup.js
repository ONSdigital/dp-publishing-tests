const {setup: setupPuppeteer} = require('jest-environment-puppeteer');
const Zebedee = require("./clients/Zebedee");

const skipSetup = process.env.SKIP_SETUP_TEARDOWN !== 'false' || false;

module.exports = async function globalSetup() {
    if (!skipSetup) {
        console.log("\nSetting up...");
        await Zebedee.initialise();
    }
    await setupPuppeteer();
}