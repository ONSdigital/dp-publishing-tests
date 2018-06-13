const { teardown: teardownPuppeteer } = require('jest-environment-puppeteer');
const Zebedee = require("./clients/Zebedee");

const skipTeardown = process.env.SKIP_SETUP_TEARDOWN !== 'false' || false;

module.exports = async function globalTeardown() {
    
    if (!skipTeardown) {
        console.log("Tearing down...");
        await Zebedee.cleanup();
    }
    await teardownPuppeteer()
}