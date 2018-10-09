import interval from 'interval-promise';
import Page from "../Page";

export const workspaceSelectors = {
    previewIframe: '#iframe',
    browserAddressBar: "#browser-location"
}

export default class WorkspacePage extends Page {

    static async waitForPreviewToLoad() {
        try {
            await page.waitForSelector(workspaceSelectors.previewIframe);
        } catch (error) {
            console.error("Error waiting for preview screen to load", error);
            fail("Error waiting for preview screen to load");
        }
    }

    static async getAddressBarPath() {
        const URL = await page.$eval(workspaceSelectors.browserAddressBar, element => element.value);
        return URL.replace(process.env.PUBLISHING_ENV_URL, "");
    }

    static async getIframeURL() {
        return await page.$eval(workspaceSelectors.previewIframe, iframe => {
            return iframe.contentWindow.location.href;
        });
    }

    static async waitForPreviewToLoadURL(URL) {
        const fullURL = `${process.env.PUBLISHING_ENV_URL}${URL}`;

        try {
            return await interval(async (_, stop) => {
                const previewURL = await this.getIframeURL();
                if (previewURL === fullURL) {
                    stop();
                }
            }, 500, {iterations: 20});
        } catch (error) {
            console.error(`Error waiting for preview to load URL '${fullURL}'`, error);
            fail(`Error waiting for preview to load URL '${fullURL}'`);
        }
    }
}