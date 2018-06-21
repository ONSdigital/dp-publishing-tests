const PuppeteerEnvironment = require('jest-environment-puppeteer');
const Zebedee = require('./clients/Zebedee');

class CustomEnvironment extends PuppeteerEnvironment {
    async setup() {
        await super.setup();

        if (process.env.DEBUG && process.env.DEBUG !== 'false') {
            this.global.page.on('console', msg => console.log('PAGE LOG:', JSON.stringify(msg.text())));
        }

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