import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from "../../pages/collections/CollectionsPage";

const tempCollectionsData = [
    {
        name: "Acceptance test collection (manual)",
        publishDate: null,
        releaseUri: null,
        teams: [],
        type: "manual",
        collectionOwner: "ADMIN"
    },
    {
        name: "Acceptance test collection (scheduled)",
        publishDate: "2020-01-08T09:30:00.000Z",
        releaseUri: null,
        teams: [],
        type: "scheduled",
        collectionOwner: "ADMIN"
    },
    {
        name: "Acceptance test collection (scheduled by release)",
        publishDate: null,
        releaseUri: "/releases/acceptancetestcalendarentry",
        teams: [],
        type: "scheduled",
        collectionOwner: "ADMIN"
    }
];

describe("List of collections", () => {

    beforeAll(async () => {
        await CollectionsPage.initialise();
        await CollectionsPage.setupCollectionsList(tempCollectionsData);
    });

    afterAll(async () => {
        await CollectionsPage.cleanupCollectionsList();
        await CollectionsPage.cleanup();
    });

    beforeEach(async () => {
        await CollectionsPage.goto();
        await CollectionsPage.waitForLoad();
        expect(await CollectionsPage.isLoaded()).toBe(true);
    });

    it("displays the collection names and publish dates", async () => {
        const allCollectionDetails = await CollectionsPage.getAllCollectionsInList();
        
        const manualTestCollection = allCollectionDetails.find(collection => {
            return collection.name === 'Acceptance test collection (manual)';
        });
        expect(manualTestCollection).toBeTruthy();
        expect(manualTestCollection.publishDate).toBe('[manual collection]');
        
        const scheduledTestCollection = allCollectionDetails.find(collection => {
            return collection.name === 'Acceptance test collection (scheduled)';
        });
        expect(scheduledTestCollection).toBeTruthy();
        expect(scheduledTestCollection.publishDate).toBe('Wed, 08/01/2020 9:30AM');
        
        const releaseTestCollection = allCollectionDetails.find(collection => {
            return collection.name === 'Acceptance test collection (scheduled by release)';
        });
        expect(releaseTestCollection).toBeTruthy();
        expect(releaseTestCollection.publishDate).toBe('Mon, 29/06/2020 9:30AM');
    });
    
    it.skip("collections are displayed in the order they were created", () => {
        
    });

    it.skip("shows a collection item as active when clicked", () => {

    });

});