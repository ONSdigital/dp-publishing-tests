import Page from "../Page";

export default class LoginSetNewPasswordPage extends Page {
    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]//*[text()='Change password']`);
        } catch (error) {
            console.error("Error waiting for screen set new password modal on login screen to load", error);
            fail("Error waiting for screen set new password modal on login screen to load");
        }
    }
}