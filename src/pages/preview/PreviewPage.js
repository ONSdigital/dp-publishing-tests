import Page from "../Page";
import url from 'url'

export default class PreviewPage extends Page {
    static async load(collectionID) {
        await super.goto(`/collections/${collectionID}/preview`).catch(error => {
            console.error("Error navigating to the preview\n", error);
        });
    }

    static async waitForLoad(pageTitle) {
        try {
            await page.waitForXPath(`//select[@id='preview-select']/option[text() = 'Select an option']`);
        } catch (error) {
            console.error("Error waiting for preview screen to load", error);
            fail("Error waiting for preview screen to load");
        }
    }

    // static async waitForLoad(pageTitle) {
    //     try {
    //         await page.waitForXPath(`//select[@id='preview-select']/option[text() = '${pageTitle}']`);
    //     } catch (error) {
    //         console.error("Error waiting for preview screen to load", error);
    //         fail("Error waiting for preview screen to load");
    //     }
    // }

    static async getIframeSrc() {
        const iframe = await page.$('iframe');
        const srcProperty = await iframe.getProperty('src');
        const src = url.parse(await srcProperty.jsonValue(), true)
        return await src.pathname;
    }

    static async iframeContentHasCorrectTitle(content) {
        const regex = RegExp('<title>([^<]*)<\/title>', 'g')
        const title = regex.exec(content)
        const titleSplit = title[1].split(" - ");
        return titleSplit[0];
    }

}