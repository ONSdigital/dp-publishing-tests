import Page from "../Page";

export default class CreatePage extends Page {
    static async isLoaded() {
        const isLoaded = await page.$$eval('.workspace-create', elements => {
            return elements.length > 0
        });

        return isLoaded;
    }

    static async waitForLoad() {
        await page.waitForSelector('.workspace-create');
    }

    // NOTE: loading directly to the create screen isn't possible because because it doesn't have routing
    // static async load(collectionID) {
    //     await super.goto(`/workspace?collection=${collectionID}`).catch(error => {
    //         console.error("Error navigating to the browse pages screen\n", error);
    //     });
    // }
}