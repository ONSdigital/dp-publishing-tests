import expectPuppeteer from 'expect-puppeteer';
import Page from "../Page";

export default class CollectionsPage extends Page {

    static async isLoaded() {
        const isLoaded = await page.$$eval('h1', headings => headings.map(heading => {
            return heading.innerText;
        }));
        return isLoaded.length > 0;
    }

    static async goto() {
        await super.goto("/collections").catch(error => {
            console.error("Error navigating to collections page\n", error);
        });
    }
}