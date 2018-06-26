import expectPuppeteer from 'expect-puppeteer';
import Page from "../Page";

export default class BrowsePages extends Page {
    static async isLoaded() {
        const isLoaded = await page.$$eval('.workspace-browse .page-list', elements => {
            return elements.length > 0
        });

        return isLoaded;
    }

    static async waitForLoad() {
        await page.waitForSelector('.workspace-browse .page-list');
    }

    static async load(collectionID) {
        await super.goto(`/workspace?collection=${collectionID}`).catch(error => {
            console.error("Error navigating to the browse pages screen\n", error);
        });
    }

    static async clickPageByURL(URL) {
        await expectPuppeteer(page).toClick(`.js-browse__item[data-url="${URL}"] .js-browse__item-title`);
    }

    static async getSelectedPageElement() {
        return await page.$('.page__container.selected');
    }
}