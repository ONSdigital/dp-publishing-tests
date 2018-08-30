import Page from "../Page";

export default class ChangeUsersPasswordPage extends Page {

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]//*[text()='Change password']`);
        } catch (error) {
            console.error("Error waiting for change user's password screen to load", error);
            fail("Error waiting for change user's password screen to load");
        }
    }
}