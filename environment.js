const PuppeteerEnvironment = require('jest-environment-puppeteer');
const Zebedee = require('./clients/Zebedee');

class CustomEnvironment extends PuppeteerEnvironment {
    async setup() {
        await super.setup();

        this.global.accessTokens = {
            tempUser: Zebedee.getTempUserAccessToken(),
            rootAdmin: Zebedee.getAdminAccessToken()
        }

        this.global.page = await this.global.browser.newPage("");
    }

    async teardown() {
        await super.teardown()
    }
}

module.exports = CustomEnvironment