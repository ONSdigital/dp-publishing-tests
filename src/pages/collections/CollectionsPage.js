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
    }

    static async setupCollectionsList(tempCollectionsData) {
        // Create a valid published calendar entry for our 'scheduled by release' collection to use
        // because Zebedee uses it's publish date to set the collection's publish date.
        await Zebedee.createCalendarEntry("Acceptance test calendar entry", "2020-06-29T08:30:00.000Z");
        
        let collections = [];
        for (const collection of tempCollectionsData) {
            const createdCollection = await Zebedee.createCollection(collection)
                .catch(error => {
                    Log.error(error);
                    throw error;
                });
            collections.push(createdCollection);
        }
        // const collections = await Promise.all(tempCollectionsData.map(collection => Zebedee.createCollection(collection)))
        //     .catch(error => {
        //         Log.error(error);
        //         throw error;
        //     });
     
        createdCollectionIDs = collections.map(collection => collection.id);
        return collections;
    }

    static getCreatedCollectionIDs() {
        return createdCollectionIDs;
    }

    static async getAllCollectionsInList() {
        const collections = await page.$$('.selectable-box__item');
        const collectionDetails = await Promise.all(collections.map(async collection => ({
            name: await collection.$eval('.grid__col-6:nth-of-type(1)', element => element.textContent),
            publishDate: await collection.$eval('.grid__col-6:nth-of-type(2)', element => element.textContent)
        })));
        await super.screenshot("all-collections");
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
        await Promise.all(createdCollectionIDs.map(collectionID => Zebedee.deleteCollection(collectionID)))
            .catch(error => {
                Log.error(error);
                throw error;
            });
    }
}