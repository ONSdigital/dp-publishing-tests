import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from "../../pages/collections/CollectionsPage";
import CollectionDetails from '../../pages/collections/CollectionDetails';
import LoginPage from '../../pages/login/LoginPage';
import Page from '../../pages/Page';

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
        name: "Acceptance test collection 3 (scheduled by release)",
        publishDate: null,
        releaseUri: "/releases/acceptancetestcalendarentry",
        teams: [],
        type: "scheduled",
        collectionOwner: "ADMIN"
    },
    {
        name: "Acceptance test collection 2 (scheduled)",
        publishDate: "2020-01-08T09:30:00.000Z",
        releaseUri: null,
        teams: [],
        type: "scheduled",
        collectionOwner: "ADMIN"
    }
];

let allCollections = [];
let createdCollections = [];

beforeAll(async () => {
    await CollectionsPage.initialise();
});

describe("List of collections", () => {

    beforeAll(async () => {
        try {
            await CollectionsPage.revokeAuthentication();
            await CollectionsPage.loginAsAdmin();
            
            console.log("Automatically creating collections");
            createdCollections = await CollectionsPage.setupCollectionsList(tempCollectionsData);
            
            await CollectionsPage.load();
            await Page.waitForRequestResponse("/zebedee/collections", "GET");
            await CollectionsPage.waitForLoad();
            allCollections = await CollectionsPage.getAllCollectionsInList();
        } catch (error) {
            console.error("List of collections setup failed\n", error);
        }
    });

    afterAll(async () => {
        try {
            console.log("Cleaning up automatically created collections");
            await CollectionsPage.cleanupCollectionsList();
        } catch (error) {
            console.error("Post collections list test cleanup failed", error);
        }
    });

    beforeEach(async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
    });

    it("redirects to the login screen if not logged in [smoke]", async () => {
        await CollectionsPage.revokeAuthentication();
        await CollectionsPage.goto(`/collections/arandomcollectionid-12345`);
        expect(await LoginPage.isLoaded());

        // reset authentication to default state
        await CollectionsPage.initialise();
    });
    
    it("redirect to the login screen includes parameter for subsequent redirect to this collection's path [smoke]", async () => {
        await CollectionsPage.revokeAuthentication();
        await CollectionsPage.goto(`/collections/arandomcollectionid-12345`);
        expect(await CollectionsPage.currentPath()).toBe(`/florence/login?redirect=%2Fflorence%2Fcollections%2Farandomcollectionid-12345`);

        // reset authentication to default state
        await CollectionsPage.initialise();
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
    
    it.skip("collections are displayed in the alphabetical order", () => {
        expect(allCollections[0].name).toBe('Acceptance test collection 1 (manual)');
        expect(allCollections[1].name).toBe('Acceptance test collection 2 (scheduled)');
        expect(allCollections[2].name).toBe('Acceptance test collection 3 (scheduled by release)');
    });

    it("shows a collection item as active when clicked", async () => {
        await expectPuppeteer(page).toClick(`#${createdCollections[0].id}`);

        let activeCollectionIDs = await CollectionsPage.getActiveCollectionIDs();
        expect(activeCollectionIDs.length).toBe(1);
        expect(activeCollectionIDs[0] === createdCollections[0].id).toBe(true);

        await expectPuppeteer(page).toClick(`#${createdCollections[1].id}`);
        activeCollectionIDs = await CollectionsPage.getActiveCollectionIDs();
        expect(activeCollectionIDs.length).toBe(1);
        expect(activeCollectionIDs[0] === createdCollections[1].id).toBe(true);
    });
    
    it("updates the URL correctly when a collection is clicked", async () => {
        expect(await CollectionsPage.currentPath()).toBe('/florence/collections');
        
        // navigationPromise allows us to listen for navigation changes and wait until 
        // they're completed. Otherwise we risk our test intermittently failing because 
        // the URL hasn't been put into the history API yet when we run expect()
        const navigationPromise = page.waitForNavigation();
        await expectPuppeteer(page).toClick(`#${createdCollections[0].id}`);
        await navigationPromise;

        expect(await CollectionsPage.currentPath()).toBe(`/florence/collections/${createdCollections[0].id}`);
    });
    
    it("displays the collection details drawer when a collection is clicked", async () => {
        expect(await CollectionsPage.currentPath()).toBe('/florence/collections');
        await expectPuppeteer(page).toClick(`#${createdCollections[1].id}`);
        await CollectionDetails.waitForLoad();
        const isLoaded = await CollectionDetails.isLoaded(createdCollections[1].name);
        expect(isLoaded).toBe(true);
    });

});