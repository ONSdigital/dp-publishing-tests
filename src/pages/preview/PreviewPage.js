import Page from "../Page";

export default class PreviewPage extends Page {
    static async load() {
        await super.goto(`/preview`).catch(error => {
            console.error("Error navigating to the preview\n", error);
        });
    }
}