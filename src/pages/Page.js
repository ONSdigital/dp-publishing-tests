import Zebedee from '../../clients/Zebedee.js';

const screenshotDir = "./screenshots/";
const florenceURL = process.env.PUBLISHING_ENV_URL + "/florence";
const isDebugMode = process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*';

export default class Page {
    
    static async initialise(doNotLogin) {
        if (isDebugMode || process.env.SHOW_PAGE_LOGS === 'true') {
            page.on('console', async msg => {
                const jsonArgs = await Promise.all(msg._args.map(arg => arg.jsonValue()));
                console.log(`Page log (level: '${msg._type}') [${new Date().toString()}]:`, ...jsonArgs);
            });
            page.on('response', async response => {
                const req = response.request();
                let body;
                if (req.resourceType() === 'fetch' || req.resourceType() === 'xhr' || req.resourceType() === 'other') {
                    try {
                        body = await response.json();
                    } catch (error) {
                        try {
                            body = await response.text();
                        } catch (error) {
                            console.error(`Error trying to parse response body to JSON or text`, error);
                            body = "Unable to parse response body";
                        }
                    }
                    console.log(`Network fetch log [${new Date().toString()}]:\n`, `${req.method()}\n`, `${response.status()}\n`, `${req.url()}\n`, body);
                }
            });
        }

        if (isDebugMode) {
            jest.setTimeout(50000);
        } else {
            jest.setTimeout(30000);
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

    static async hasGlobalErrorMsg() {
        const errorMsgExists = await page.$$eval('.notifications__item--warning, .sweet-alert.visible', elements => {
            return elements.length > 0;
        });

        return errorMsgExists;
    }

    static async waitForNotification() {
        try {
            await page.waitForSelector('li.notifications__item');

            // We wait until the animation has ended on the notification item.
            // We use a promise so that we can wait until the transitionend event is fired
            // before continuing with the rest of the test (or else it'll fail on slower machines)
            await page.$eval('li.notifications__item', element => {
                return new Promise((resolve, reject) => {
                    const rejectTimer = setTimeout(() => {
                        reject("Notification transitionend event not fired within 5 seconds");
                    }, 5000);
                    element.addEventListener('transitionend', () => {
                        console.log("Notification displayed");
                        clearTimeout(rejectTimer);
                        resolve();
                    });
                })
            });
        } catch (error) {
            console.error("Error waiting for notification to show", error);
            fail("Error waiting for notification to show");
        }
    }

    static async lastEditText() {
        return await page.$eval('.expandable-item__contents p', element => element.textContent);
    }

    static async notificationsAreHidden() {
        return await page.waitForSelector('li.notifications__item', {
            hidden: true,
        })
    }

    static async waitForRequestResponse(URL, method = "GET") {
        if (URL.startsWith("/")) {
            URL = `${process.env.PUBLISHING_ENV_URL}${URL}`;
        }
        
        return new Promise((resolve, reject) => {
            const handleResponse = async response => {
                const req = response.request();
                if (req.url() === URL && req.method() === method) {
                    page.removeListener('response', handleResponse);
                    clearTimeout(failureTimer);
                    resolve();
                }
            };

            const failureTimer = setTimeout(() => {
                page.removeListener('response', handleResponse);
                fail(`Timed out (10000ms) waiting for response from ${method} request to URL '${URL}'`);
                reject();
            }, 10000);

            page.on('response', handleResponse);
        })
    }
}