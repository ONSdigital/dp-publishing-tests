import Zebedee from "../../../clients/Zebedee";
import Page from "../Page";
import Log from "../../utilities/Log";

let createdCollectionIDs = [];

export default class CollectionsPage extends Page {

    static async isLoaded() {
        const isLoaded = await page.$$eval('h1', headings => headings.map(heading => {
            return heading.innerText;
        }));
        return isLoaded.length > 0;
    }

    static async waitForLoad() {
        await page.waitForSelector('h1', {text: "Select a collection", visible: true});
    }

    static async goto() {       
        await super.goto("/collections").catch(error => {
            console.error("Error navigating to collections page\n", error);
        });
        await super.screenshot("all-collections");
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

    static async setupCollectionsList(tempCollectionsData) {
        // Create a valid published calendar entry for our 'scheduled by release' collection to use
        // because Zebedee uses it's publish date to set the collection's publish date.
        await Zebedee.createCalendarEntry("Acceptance test calendar entry", "2020-06-29T08:30:00.000Z");
        
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

    static async cleanupCollectionsList() {
        await Promise.all(createdCollectionIDs.map(async collectionID => await Zebedee.deleteCollection(collectionID)))
            .catch(error => {
                Log.error(error);
                throw error;
            });

        const deletedCalendarEntryCollection = await Zebedee.deleteTestCalendarEntry();
        await Zebedee.deleteCollection(deletedCalendarEntryCollection.id);
        
    }
}