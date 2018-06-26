import Page from "../Page";

export const collectionDetailsSelectors = {
    createEditPage: 'a[href^="/florence/workspace?collection="]'
}

export default class CollectionDetails extends Page {

    static async isLoaded(name) {
        const isLoaded = await page.$eval('.drawer h2', (heading, name) => {
            return heading.textContent === name
        }, name);

        return isLoaded;
    }

    static async waitForLoad() {
        await page.waitForSelector('.drawer.visible:not(.animatable)');
    }

    static async load(ID) {       
        await super.goto(`/collections/${ID}`).catch(error => {
            console.error("Error navigating to a collection's details screen\n", error);
        });
        await super.screenshot("collection-details");
    }

    static async getElement() {
        return await page.$('.drawer');
    }

    static async getHeadingData() {
        const name = await page.$eval('.drawer h2', heading => heading.textContent);
        const publishDate = await page.$eval('.drawer h2 + p', element => element.textContent);

        return {
            name,
            publishDate
        }
    }
}