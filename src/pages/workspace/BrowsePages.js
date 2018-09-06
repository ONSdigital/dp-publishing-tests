import expectPuppeteer from 'expect-puppeteer';
import Page from "../Page";
import interval from 'interval-promise';

export const browsePagesSelector = {
    createButton: ".btn-browse-create",
    previewIframe: '#iframe'
}

export default class BrowsePages extends Page {
    static async isLoaded() {
        const isLoaded = await page.$$eval('.workspace-browse .page-list', elements => {
            return elements.length > 0
        });

        return isLoaded;
    }

    static async waitForLoad() {
        // NOTE: The browse screen can take a VERY long time to load so
        // this code might be a place to start for unexpected failures
        // due to timeouts
        try {
            await Promise.race([
                page.waitForNavigation({waitUntil: 'load'}),
                page.waitForNavigation({waitUntil: 'networkidle0'})
            ]);
            await page.waitForSelector('.workspace-browse .page-list');
        } catch (error) {
            console.error("Error waiting for browse screen to load", error);
            fail("Failed waiting for browse screen to load");
        }
    }

    static async load(collectionID) {
        await super.goto(`/workspace?collection=${collectionID}`).catch(error => {
            console.error("Error navigating to the browse pages screen\n", error);
        });
    }

    static async clickPageByURL(URL) {
        try {
            await expectPuppeteer(page).toClick(`.js-browse__item[data-url="${URL}"] .js-browse__item-title`);
        } catch (error) {
            console.error(`Error trying to click a page in browse tree with the URL '${URL}'`);
            fail(`Failed trying to click a page in browse tree with the URL '${URL}'`);
        }
    }

    static async waitForPageSelection(URL) {
        try {
            await page.waitForSelector(`.js-browse__item[data-url="${URL}"] .btn-browse-edit`, {visible: true});
        } catch (error) {
            console.error(`Error waiting for page with URL '${URL}' to show as selected`);
            fail(`Failed waiting for page with URL '${URL}' to show as selected`);
        }
    }

    static async getSelectedPageElement() {
        try {
            return await page.$('.page__container.selected');
        } catch (error) {
            console.error("Error trying to get selected page element in browse tree");
            throw error;
        }
    }

    static async waitForPreviewToLoadURL(URL) {
        const fullURL = `${process.env.PUBLISHING_ENV_URL}${URL}`;
        const getPreviewURL = async () => {
            return await page.$eval(browsePagesSelector.previewIframe, iframe => {
                return iframe.contentWindow.location.href;
            });
        };

        try {
            return await interval(async (_, stop) => {
                const previewURL = await getPreviewURL();
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