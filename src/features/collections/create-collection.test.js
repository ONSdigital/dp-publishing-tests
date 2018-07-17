import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage, { collectionsPageSelectors } from '../../pages/collections/CollectionsPage';
import CollectionDetails from '../../pages/collections/CollectionDetails';
import CollectionSelectCalendarEntry from '../../pages/collections/CollectionSelectCalendarEntry';
import Page from '../../pages/Page';

describe("Creating a new collection", () => {
    
    beforeAll(async () => {
        await CollectionsPage.initialise();

        // FIXME this is only need for the scheduled by calendar entry test
        // we should consider how we only run this setup for those tests 
        // e.g. splitting them out in to their down describe block
        await CollectionsPage.setupLiveCalendarEntry();
    });
    
    afterAll(async () => {
        await CollectionsPage.cleanupCreatedCollections();

        // FIXME this is only need for the scheduled by calendar entry test
        // we should consider how we only run this setup for those tests 
        // e.g. splitting them out in to their down describe block
        await CollectionsPage.deleteLiveCalendarEntry();
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
            const expectedError = `Element ${collectionsPageSelectors.scheduledPublishTypes} not found`;
            expect(error.toString()).toMatch(expectedError);
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
    
    it("create a collection scheduled to publish by a calendar entry", async () => {
        await CollectionsPage.fillCreateCollectionForm({
            name: "Acceptance test - created scheduled-by-calendar-entry collection",
            releaseType: "scheduled",
            scheduledBy: "calendar-entry",
            releaseURI: "/releases/acceptancetestcalendarentry"
        });

        await expectPuppeteer(page).toClick('button', {text: 'Select a calendar entry'});
        await CollectionSelectCalendarEntry.waitForLoad();
        await expectPuppeteer(page).toFill('#search-releases', 'Acceptance test');
        await expectPuppeteer(page).toMatchElement('.selectable-box__status');
        await CollectionSelectCalendarEntry.waitForLoad();
        await expectPuppeteer(page).toClick('.selectable-box__item div', {text: "Acceptance test calendar entry"});
        await expectPuppeteer(page).toClick('button', {text: "Submit"});
        
        try {
            await expectPuppeteer(page).toMatchElement('.modal__inner');
            fail("Expected 'Select a calendar entry' modal to be closed");
        } catch (error) {
            const expectedError = `Element .modal__inner not found`;
            expect(error.toString()).toMatch(expectedError);
        }

        await expectPuppeteer(page).toMatch("Selected release: Acceptance test calendar entry");

        const newCollection = await CollectionsPage.submitCreateCollectionForm();
        CollectionsPage.addCreatedCollectionID(newCollection.id);

        await CollectionDetails.waitForLoad();

        const headingDetails = await CollectionDetails.getHeadingData();
        expect(headingDetails.name).toBe("Acceptance test - created scheduled-by-calendar-entry collection");
        expect(headingDetails.publishDate).toBe("Publish date: Monday, 29 June 2020 9:30AM");
    });

    // TODO scheduling by release
    // TODO adding teams to a collection
    // TODO test defaults input values?
    // TODO test validation

});