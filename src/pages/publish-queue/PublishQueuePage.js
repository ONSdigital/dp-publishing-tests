import interval from 'interval-promise';

import Zebedee from "../../../clients/Zebedee";
import Page from "../Page";

export const publishQueueSelectors = {
    collectionsDrawer: '.panel.panel--off-canvas',
    collectionAction: '.js-accordion.active button'
};

export default class PublishQueuePage extends Page {
    static async isLoaded() {
        const isLoaded = await page.$eval('h1', element => {
            return element.textContent === 'Select a publish date'
        });

        return isLoaded;
    }

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//h1[text()='Select a publish date']`);
        } catch (error) {
            console.error("Error waiting for publishing queue screen to load", error);
            fail('Error waiting for publishing queue screen to load');
        }
    }

    static async load() {
        await super.goto(`/publishing-queue`).catch(error => {
            console.error("Error navigating to the publishing queue\n", error);
        });
    }

    static async collectionAccordionTitleElement(ID) {
        const matchingTitles = await page.$x(`//*[contains(@class, "js-accordion__title")][descendant::h3[@data-id="${ID}"]]`);
        return matchingTitles[0];
    }

    static async collectionHasPublished(ID) {
        let response = false;
        
        await interval(async (_, stop) => {
            const hasPublished = await Zebedee.collectionHasPublished(ID);
            if (hasPublished) {
                response = true;
                stop();
            }
        }, 500, {iterations: 20});
        
        return response;
    }
}