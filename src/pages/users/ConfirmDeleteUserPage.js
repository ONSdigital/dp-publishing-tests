import Page from "../Page";

export default class ConfirmDeleteUserPage extends Page {

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]/*[text()='Confirm delete']`);
        } catch (error) {
            console.error("Error waiting for confirm user deletion screen to load", error);
            fail("Error waiting for confirm user deletion screen to load");
        }
    }
}