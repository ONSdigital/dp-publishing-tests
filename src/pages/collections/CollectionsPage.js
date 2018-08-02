import expectPuppeteer from 'expect-puppeteer';
import interval from 'interval-promise';

import Zebedee from "../../../clients/Zebedee";
import Page from "../Page";
import Log from "../../utilities/Log";

let createdCollectionIDs = [];

export const collectionsPageSelectors = {
    createForm: "form",
    manualPublish: "#manual-radio",
    scheduledPublish: "#scheduled-radio",
    scheduledPublishTypes: 'input[name="schedule-type"]',
    scheduledByDate: '#custom-radio',
    scheduledByCalendarEntry: '#calendar-radio',
    createCollectionButton: 'form button[type="submit"]'
};

export default class CollectionsPage extends Page {

    static async isLoaded() {
        const headings = await page.$$eval('h1', headings => headings.map(heading => heading.textContent));
        return headings[0] === 'Select a collection';
    }

    static async waitForLoad() {
        await page.waitForSelector('h1', {text: "Select a collection", visible: true});
    }

    static async load() {       
        await super.goto("/collections").catch(error => {
            console.error("Error navigating to collections page\n", error);
        });
    }


    static async waitForCollectionToDisappear(ID) {
        const checkCollectionVisibility = async () => {
            await this.load();
            await this.waitForLoad();
            const allCollections = await this.getAllCollectionsInList();
            const isVisible = allCollections.some(collection => collection.id === ID);
            return isVisible;
        }

        await interval(async (_, stop) => {
            const collectionIsVisible = await checkCollectionVisibility();
            if (!collectionIsVisible) {
                stop();
            }
        }, 500, {iterations: 20});
    }

    static async fillCreateCollectionForm(collectionData) {
        await expectPuppeteer(page).toFillForm(collectionsPageSelectors.createForm, {
            'collection-name': collectionData.name
        });

        if (collectionData.releaseType === "manual") {
            await expectPuppeteer(page).toClick(collectionsPageSelectors.manualPublish);
        }

        if (collectionData.releaseType === "scheduled") {
            await expectPuppeteer(page).toClick(collectionsPageSelectors.scheduledPublish);
        }
        
        if (collectionData.scheduledBy === "date" && collectionData.publishDate) {
            await expectPuppeteer(page).toClick(collectionsPageSelectors.scheduledByDate);
            await expectPuppeteer(page).toFillForm(collectionsPageSelectors.createForm, {
                'publish-date': collectionData.publishDate,
                'publish-time': collectionData.publishTime
            });
        }
        
        if (collectionData.scheduledBy === "calendar-entry") {
            await expectPuppeteer(page).toClick(collectionsPageSelectors.scheduledByCalendarEntry);
        }
    }
    
    static async submitCreateCollectionForm() {
        let completedZebedeeRequest;
        let requestErrored = false;
        const handleResponse = async request => {
            if (request.url() !== `${process.env.PUBLISHING_ENV_URL}/zebedee/collection`) {
                return;
            }

            const response = request.response();
            if (!response.ok()) {
                requestErrored = true;
                throw Error(`Error when submit created collection - ${response.status()}: ${await response.text()}`);
            }
            const json = await response.json();
            completedZebedeeRequest = json;
        };
        page.on('requestfinished', handleResponse);
        await expectPuppeteer(page).toClick(collectionsPageSelectors.createCollectionButton);
        
        
        let createdCollection;
        await interval(async (_, stop) => {
            createdCollection = completedZebedeeRequest;
            if (createdCollection || requestErrored) {
                stop();
            }
        }, 500, {iterations: 15});

        page.removeListener('requestfinished', handleResponse);

        if (!createdCollection) {
            throw Error('Unexpected error from API for creating a collection from form submit');
        }

        return createdCollection;
    }

    static async getActiveCollectionIDs() {
        const activeCollectionIDs = await page.$$eval('.selectable-box__item.selected', collections => (
            collections.map(collection => collection.id)
        )).catch(() => {
            console.log("No active collections found");
            return [];
        });
        return activeCollectionIDs;
    }


    static async setupLiveCalendarEntry() {
        const collection = await Zebedee.createCalendarEntry("Acceptance test calendar entry", "2020-06-29T08:30:00.000Z");
        if (collection.id) {
            this.addCreatedCollectionID(collection.id);
        }
    }
    
    static async deleteLiveCalendarEntry() {
        const deletedCalendarEntryCollection = await Zebedee.deleteTestCalendarEntry();
        await Zebedee.deleteCollection(deletedCalendarEntryCollection.id);
    }

    static async setupCollectionsList(tempCollectionsData) {
        // Create a valid published calendar entry for our 'scheduled by release' collection to use
        // because Zebedee uses it's publish date to set the collection's publish date.
        await this.setupLiveCalendarEntry();
        
        let collections = [];
        // Use for...of so that we can ensure collections are created in the order we want them
        // or else we risk invalidating any tests on the rendered order of collections lists
        for (const collection of tempCollectionsData) {
            const createdCollection = await Zebedee.createCollection(collection)
                .catch(error => {
                    Log.error(error);
                    throw error;
                });
            collections.push(createdCollection);
        }
     
        createdCollectionIDs = [
            ...createdCollectionIDs,
            ...collections.map(collection => collection.id)
        ];
        return collections;
    }

    static addCreatedCollectionID(ID) {
        createdCollectionIDs.push(ID)
    }

    static getCreatedCollectionIDs() {
        return createdCollectionIDs;
    }

    static async getAllCollectionsInList() {
        const collections = await page.$$('.selectable-box__item');
        const collectionDetails = await Promise.all(collections.map(async collection => {
            const collectionIDPromise = await collection.getProperty('id');
            const collectionID = await collectionIDPromise.jsonValue();
            return {
                name: await collection.$eval('.grid__col-6:nth-of-type(1)', element => element.textContent),
                publishDate: await collection.$eval('.grid__col-6:nth-of-type(2)', element => element.textContent),
                id: collectionID
            }
        }));
        return collectionDetails;
    }

    static async selectCollectionByID(ID) {
        const collection = await page.$(`#${ID}`).catch(error => {
            Log.error(`Error finding collection by ID '${ID}'`);
            throw error;
        });
        return collection;
    }

    static async cleanupCreatedCollections() {
        if (!createdCollectionIDs || createdCollectionIDs.length === 0) {
            console.log("No collections to cleanup");
            return Promise.resolve();
        }

        console.log(`Collections to be cleaned up:\n${createdCollectionIDs.join('\n')}`)
        await Promise.all(createdCollectionIDs.map(async collectionID => await Zebedee.deleteCollection(collectionID)))
            .catch(error => {
                Log.error(error);
                throw error;
            });
    }

    static async cleanupCollectionsList() {
        await this.cleanupCreatedCollections();
        await this.deleteLiveCalendarEntry();
    }
}