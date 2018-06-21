import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage, { collectionsPageSelectors } from '../../pages/collections/CollectionsPage';
import CollectionDetails from '../../pages/collections/CollectionDetails';

describe("Collections screen", () => {
    
    beforeAll(async () => {
        await CollectionsPage.initialise();
    });
    
    afterAll(async () => {
        await CollectionsPage.cleanupCreatedCollections();
    });

    beforeEach(async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
    });
    
    it("create a manually published collection", async () => {
        await CollectionsPage.fillCreateCollectionForm({
            name: "Acceptance test - created manual collection",
            releaseType: "manual",
        });

        // Scheduling options should be hidden because we've selected a manual publish
        try {
            await expectPuppeteer(page).toMatchElement(collectionsPageSelectors.scheduledPublishTypes);
            fail("Schedule publish options are showing but shouldn't when 'manual publish' is selected");
        } catch (error) {
            const expectedError = Error(`Element ${collectionsPageSelectors.scheduledPublishTypes} not found waiting for function failed: timeout 500ms exceeded`);
            expect(error).toEqual(expectedError);
        }

        const newCollection = await CollectionsPage.submitCreateCollectionForm();
        CollectionsPage.addCreatedCollectionID(newCollection.id);

        await CollectionDetails.waitForLoad();
        
        const collectionDetails = await CollectionDetails.getElement();
        await expectPuppeteer(collectionDetails).toMatch("Acceptance test - created manual collection");
        await expectPuppeteer(collectionDetails).toMatch("Manual publish");
    });
    
    it("create a collection scheduled to publish by a date", async () => {
        await CollectionsPage.fillCreateCollectionForm({
            name: "Acceptance test - created scheduled-by-date collection",
            releaseType: "scheduled",
            scheduledBy: "date",
            publishDate: "21-08-2020",
            publishTime: "10:30",
        });

        await expectPuppeteer(page).toMatchElement(collectionsPageSelectors.scheduledPublishTypes);

        const newCollection = await CollectionsPage.submitCreateCollectionForm();
        CollectionsPage.addCreatedCollectionID(newCollection.id);

        await CollectionDetails.waitForLoad();
        
        const headingDetails = await CollectionDetails.getHeadingData();
        expect(headingDetails.name).toBe("Acceptance test - created scheduled-by-date collection");
        expect(headingDetails.publishDate).toBe("Publish date: Friday, 21 August 2020 10:30AM");
    });
    
    it.skip("create a collection scheduled to publish by a calendar entry", async () => {
        // await CollectionsPage.fillCreateCollectionForm({
        //     name: "Acceptance test - created scheduled-by-date collection",
        //     releaseType: "scheduled",
        //     scheduledBy: "date",
        //     publishDate: "21-08-2020",
        //     publishTime: "10:30",
        // });

        // await expectPuppeteer(page).toMatchElement(collectionsPageSelectors.scheduledPublishTypes);

        // const newCollection = await CollectionsPage.submitCreateCollectionForm();
        // CollectionsPage.addCreatedCollectionID(newCollection.id);

        // await CollectionDetails.waitForLoad();
        
        // const headingDetails = await CollectionDetails.getHeadingData();
        // expect(headingDetails.name).toBe("Acceptance test - created scheduled-by-date collection");
        // expect(headingDetails.publishDate).toBe("Publish date: Friday, 21 August 2020 10:30AM");
    });

    // TODO scheduling by release
    // TODO adding teams to a collection
    // TODO test defaults input values?
    // TODO test validation

});