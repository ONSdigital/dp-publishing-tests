import Page from "../Page";

export default class CollectionSelectCalendarEntry extends Page {

    static async isLoaded() {
        try {
            return await page.$eval('#collection-edit-name', _ => {
                return true;
            });
        } catch (err) {
            return false;
        }
    }

    static async waitForLoad() {
        await page.waitForSelector('#search-releases:enabled');
        await page.waitForSelector('.selectable-box__status', {hidden: true});
    }
}