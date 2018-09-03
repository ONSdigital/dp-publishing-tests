import Page from "../Page";

export const deleteUserSelector = {
    deleteButton: ".modal__footer button[type='submit']",
    cancelButton: ".modal__footer button[type='button']",
    input: "#confirm-delete",
    errorMessage: ".modal__body .error-msg"
};

export default class ConfirmDeleteUserPage extends Page {
    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]/*[text()='Confirm delete']`);
        } catch (error) {
            console.error("Error waiting for confirm user deletion screen to load", error);
            throw new Error("Error waiting for confirm user deletion screen to load");
        }
    }

    static async waitToBeHidden() {
        try {
            await page.waitForXPath(`//*[contains(@class, "modal__header")]/*[text()='Confirm delete']`, {hidden: true});
        } catch (error) {
            console.error("Error waiting for confirm user deletion screen to no longer show", error);
            throw new Error("Error waiting for confirm user deletion screen to no longer show");
        }
    }

    static async load(ID) {
        await super.goto(`/users/${ID}/confirm-delete`).catch(error => {
            console.error("Error navigating to dialogue to confirm deleting a user\n", error);
        });
    }

    static async screenshot() {
        await super.screenshot("confirm-user-delete");
    }

    static async getInlineErrorMessage() {
        return await page.$eval(deleteUserSelector.errorMessage, element => element.textContent);
    }

    static async errorMessageIsVisible() {
        return await page.$(deleteUserSelector.errorMessage) !== null;
    }
}