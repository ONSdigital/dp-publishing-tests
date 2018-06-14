import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from "../../pages/collections/CollectionsPage";

const tempCollectionsData = [
    {
        name: "Acceptance test collection 1 (manual)",
        publishDate: null,
        releaseUri: null,
        teams: [],
        type: "manual",
        collectionOwner: "ADMIN"
    },
    {
        name: "Acceptance test collection 2 (scheduled)",
        publishDate: "2020-01-08T09:30:00.000Z",
        releaseUri: null,
        teams: [],
        type: "scheduled",
        collectionOwner: "ADMIN"
    },
    {
        name: "Acceptance test collection 3 (scheduled by release)",
        publishDate: null,
        releaseUri: "/releases/acceptancetestcalendarentry",
        teams: [],
        type: "scheduled",
        collectionOwner: "ADMIN"
    }
];

let allCollections = [];

describe("List of collections", () => {

    beforeAll(async () => {
        await CollectionsPage.initialise();
        await CollectionsPage.setupCollectionsList(tempCollectionsData);
        await CollectionsPage.goto();
        allCollections = await CollectionsPage.getAllCollectionsInList();
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
        const manualTestCollection = allCollections.find(collection => {
            return collection.name === 'Acceptance test collection 1 (manual)';
        });
        expect(manualTestCollection).toBeTruthy();
        expect(manualTestCollection.publishDate).toBe('[manual collection]');
        
        const scheduledTestCollection = allCollections.find(collection => {
            return collection.name === 'Acceptance test collection 2 (scheduled)';
        });
        expect(scheduledTestCollection).toBeTruthy();
        expect(scheduledTestCollection.publishDate).toBe('Wed, 08/01/2020 9:30AM');
        
        const releaseTestCollection = allCollections.find(collection => {
            return collection.name === 'Acceptance test collection 3 (scheduled by release)';
        });
        expect(releaseTestCollection).toBeTruthy();
        expect(releaseTestCollection.publishDate).toBe('Mon, 29/06/2020 9:30AM');
    });
    
    it("collections are displayed in the alphabetical order", () => {
        expect(allCollections[0].name).toBe('Acceptance test collection 1 (manual)');
        expect(allCollections[1].name).toBe('Acceptance test collection 2 (scheduled)');
        expect(allCollections[2].name).toBe('Acceptance test collection 3 (scheduled by release)');
    });

    it.skip("shows a collection item as active when clicked", () => {

    });

});