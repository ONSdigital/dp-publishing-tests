import Page from "../Page";
import url from 'url'

export default class PreviewPage extends Page {
    static async load(collectionID) {
        await super.goto(`/collections/${collectionID}/preview`).catch(error => {
            console.error("Error navigating to the preview\n", error);
        });
    }

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