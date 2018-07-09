import Page from "../Page";


export default class CollectionRestoreContent extends Page {

    static async isLoaded() {
        try {
            return await page.$eval('#search-deleted-content', _ => {
                return true;
            });
        } catch (err) {
            return false;
        }
    }

    static async waitForLoad() {
        return await page.waitForSelector('#search-deleted-content');
    }
}