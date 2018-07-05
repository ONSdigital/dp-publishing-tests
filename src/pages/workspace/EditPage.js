import Page from "../Page";

export const editPageSelectors = {
    container: '.workspace-edit',
    saveButton: '.btn-edit-save',
    submitForReviewButton: '.btn-edit-save-and-submit-for-review',
    submitForApprovalButton: '.btn-edit-save-and-submit-for-approval'
};

export default class EditPage extends Page {
    static async isLoaded() {
        const isLoaded = await page.$$eval(editPageSelectors.container, elements => {
            return elements.length > 0
        });

        return isLoaded;
    }

    static async waitForLoad() {
        try {
            return await page.waitForSelector(editPageSelectors.container);
        } catch (error) {
            console.error("Error waiting for edit page screen to load", error);
            fail('Error waiting for edit page screen to load');
        }
    }

    // NOTE: loading directly to the edit page screen isn't possible because because it doesn't have routing
    // static async load(collectionID) {
    //     await super.goto(`/workspace?collection=${collectionID}`).catch(error => {
    //         console.error("Error navigating to the edit page screen\n", error);
    //     });
    // }
}