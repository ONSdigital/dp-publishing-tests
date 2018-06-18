import Zebedee from "../../../clients/Zebedee";
import Page from "../Page";

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
}