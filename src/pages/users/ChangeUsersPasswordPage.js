import Page from "../Page";

export const changeUserPasswordSelectors = {
    passwordInput: ".modal__body #new-password",
    saveButton: ".modal__footer button[type='submit']",
    cancelButton: ".modal__footer button[type='button']",
    errorMessage: ".modal__body .error-msg"
}

export default class ChangeUsersPasswordPage extends Page {

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]//*[text()='Change password']`);
        } catch (error) {
            console.error("Error waiting for change user's password screen to load", error);
            fail("Error waiting for change user's password screen to load");
        }
    }

    static async waitToBeHidden() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]/*[text()='Change password']`, {hidden: true});
        } catch (error) {
            console.error("Error waiting for changes user's password screen to no longer show", error);
            throw new Error("Error waiting for changes user's password screen to no longer show");
        }
    }

    static async load(ID) {
        await super.goto(`/users/${ID}/change-password`).catch(error => {
            console.error(`Error navigating to 'change password' screen for user '${ID}'\n`, error);
        });
    }

    static async getInlineErrorMessage() {
        return await page.$eval(changeUserPasswordSelectors.errorMessage, element => element.textContent);
    }

    static async errorMessageIsVisible() {
        return await page.$(changeUserPasswordSelectors.errorMessage) !== null;
    }
}