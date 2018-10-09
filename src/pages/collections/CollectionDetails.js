import Page from "../Page";

export const collectionDetailsSelectors = {
    createEditPageButton: 'a[href^="/florence/workspace?collection="]',
    pageItem: '.page',
    pageActionButton: '.list__item--expandable.active button',
    approveCollection: '#approve-collection'
}

export default class CollectionDetails extends Page {

    static async isLoaded(name) {
        const isLoaded = await page.$eval('.drawer h2', (heading, name) => {
            return heading.textContent === name
        }, name);

        return isLoaded;
    }

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "drawer__heading")]//a[contains(text(),'Edit')]`);
        } catch (error) {
            console.error("Error waiting for collection details to load", error);
            fail('Error waiting for collection details to load');
        }
    }

    static async load(ID) {       
        await super.goto(`/collections/${ID}`).catch(error => {
            console.error("Error navigating to a collection's details screen\n", error);
        });
    }

    static async getElement() {
        return await page.$('.drawer');
    }

    static async getHeadingData() {
        const name = await page.$eval('.drawer h2', heading => heading.textContent);
        const publishDate = await page.$eval('.drawer h2 + p', element => element.textContent);

        return {
            name,
            publishDate
        }
    }

    static async getActiveCollectionID() {
        const path = await page.evaluate(() => {
            return location.pathname;
        });
        return path.split('/').pop();
    }
    
    static async waitForDrawerToClose() {
        try {
            await page.waitForSelector('.drawer.animatable');
        } catch (error) {
            console.error("Error waiting for collection details drawer to close", error);
            fail('Error waiting for collection details drawer to close');
        }
    }

    static async drawerIsVisible() {
        try {
            return await page.$eval('.drawer.animatable', _ => {
                return false;
            })
        } catch (error) {
            return true;
        }
    }

    static async setCollectionCookie(collectionID) {
        console.log(`Setting collection cookie for: ${collectionID}`)
        await page.setCookie({
            name: "collection",
            value: collectionID,
            url: process.env.PUBLISHING_ENV_URL,
            session: true
        });
    }

    static async deleteButtonIsVisible() {
        return await page.$$eval('#delete-collection', element => element.length > 0)
    }

    static async pageOptionsAreVisible() {
        return await page.waitForSelector('.expandable-item__contents', {
            visible: true,
        })
    }

    static async pageOptionsAreHidden() {
        return await page.waitForSelector('.expandable-item__contents', {
            hidden: true,
        })
    }

    static async collectionExistsInCollectionList(collectionID) {
        return await page.$$eval(`#${collectionID}`, elements => elements.length > 0);
    }
}