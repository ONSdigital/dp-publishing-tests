import Zebedee from '../../clients/Zebedee.js';

const screenshotDir = "./screenshots/";
const florenceURL = process.env.PUBLISHING_ENV_URL + "/florence";

export default class Page {
    
    static async initialise(doNotLogin) {
        if (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') {
            jest.setTimeout(20000);
        }
        
        await page.setViewport({width: 1920, height: 979});

        if (doNotLogin) {
            await this.revokeAuthentication();
            return;
        }

        // TODO detect if cookie is set first and not set cookie again if so.
        let tempAccessToken = Zebedee.getTempUserAccessToken();
        if (!tempAccessToken) {
            await Zebedee.createTempAdminUser(Zebedee.getAdminAccessToken());
            tempAccessToken = Zebedee.getTempUserAccessToken();
        }
        
        // Go to any page first because we can't set cookies on a blank page
        // and we need to set the access_token for accessing the collections screen
        await this.goto("").catch(error => {
            console.error("Error navigating to login page\n", error);
        });

        await this.setAccessTokenCookie(tempAccessToken);
        await this.setSessionEmailLocalStorage(Zebedee.getTempAdminUserEmail());
        await this.setUserTypeLocalStorage("PUBLISHING_SUPPORT");
    }

    static async goto(path) {
        return await page.goto(`${florenceURL}${path}`);
    }

    static async screenshot(name) {
        await page.screenshot({
            path: `${screenshotDir}${name}.png`
        });
    }

    static async currentPath() {
        const URL = await page.url();
        return URL.replace(process.env.PUBLISHING_ENV_URL, "");
    }

    static async setAccessTokenCookie(token) {
        await page.setCookie({
            name: "access_token",
            value: token,
            url: process.env.PUBLISHING_ENV_URL,
            session: true
        });
    }

    static async setSessionEmailLocalStorage(email) {
        await page.evaluate(email => {
            localStorage.setItem("loggedInAs", email);
        }, email);
    }

    static async setUserTypeLocalStorage(userType) {
        await page.evaluate(userType => {
            localStorage.setItem("userType", userType);
        }, userType);
    }

    static async revokeAuthentication() {
        const cookies = await page.cookies(process.env.PUBLISHING_ENV_URL);
        if (cookies.length > 0 && !cookies.some(cookie => cookie.name === "access_token")) {
            return;
        }
        await page.deleteCookie({name: "access_token", url: process.env.PUBLISHING_ENV_URL});
    }

}