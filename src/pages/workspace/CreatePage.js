import expectPuppeteer from 'expect-puppeteer';

import Page from "../Page";

export const createPageSelectors = {
    container: '.workspace-create',
    pageTypeSelect: '#pagetype',
    submitButton: '.btn-page-create',
    editionInput: '#edition',
    releaseDateInput: '#releaseDate',
    datePickerModal: '#ui-datepicker-div',
    datePickerDay: 'td a.ui-state-default'
};

export default class CreatePage extends Page {
    static async isLoaded() {
        const isLoaded = await page.$$eval(createPageSelectors.container, elements => {
            return elements.length > 0
        });

        return isLoaded;
    }

    static async waitForLoad() {
        try {
            await page.waitForSelector(createPageSelectors.container);
        } catch (error) {
            console.error("Error waiting for create page to load", error);
            fail("Error waiting for create page to load");
        }
    }

    // NOTE: loading directly to the create screen isn't possible because because it doesn't have routing
    // static async load(collectionID) {
    //     await super.goto(`/workspace?collection=${collectionID}`).catch(error => {
    //         console.error("Error navigating to the browse pages screen\n", error);
    //     });
    // }

    static async fillCreatePageForm(pageData) {
        if (pageData.edition) {
            await expectPuppeteer(page).toFill(createPageSelectors.editionInput, pageData.edition);
        }
        
        const releaseDateInputExists = await page.$$eval(createPageSelectors.releaseDateInput, elements => elements.length > 0);
        if (releaseDateInputExists && !pageData.releaseDate) {
            await expectPuppeteer(page).toClick(createPageSelectors.releaseDateInput);
            await expectPuppeteer(page).toClick(createPageSelectors.datePickerDay);

            try {
                // Wait for the date picker to close, it has an animation so this can sometimes breaks tests
                // if we don't wait for it to disappear.
                await page.waitFor(500);
            } catch (error) {
                console.error("Error waiting for date picker to close", error);
            }
        }
        
        if (pageData.name) {
            await expectPuppeteer(page).toFill('#pagename', pageData.name);
        }
    }
}