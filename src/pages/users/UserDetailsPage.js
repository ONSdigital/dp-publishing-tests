import Page from "../Page";

export default class UserDetailsPage extends Page {

    static async isLoaded(name) {
        const isLoaded = await page.$eval('.drawer h2', (heading, name) => {
            return heading.textContent === name
        }, name);

        return isLoaded;
    }

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "drawer__heading")]`);
        } catch (error) {
            console.error("Error waiting for user details to load", error);
            fail('Error waiting for user details to load');
        }
    }

    static async load(ID) {       
        await super.goto(`/users/${ID}`).catch(error => {
            console.error("Error navigating to a user's details screen\n", error);
        });
        await super.screenshot("user-details");
    }

    static async screenshot() {
        await super.screenshot("user-details");
    }

    static async changePasswordButtonIsVisible() {
        return await page.waitForXPath(`//a[text()='Change password']`);
    }

    static async changePasswordButtonIsNotVisible () {
        return await page.waitForXPath(`//a[text()='Change password']`, {hidden: true});
    }

}