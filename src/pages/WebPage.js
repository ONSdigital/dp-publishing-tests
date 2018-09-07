import Page from "./Page";

const websiteURL = process.env.WEB_ENV_URL;

export default class WebPage extends Page {
    static async goto(path) {
        if (!websiteURL) {
            console.error("Unable to navigate to website because no WEB_ENV_URL provided");
            return;
        }
        return await page.goto(`${websiteURL}${path}`);
    }
}