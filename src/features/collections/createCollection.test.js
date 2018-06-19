import expectPuppeteer from 'expect-puppeteer';
import CollectionsPage, { collectionsPageSelectors } from '../../pages/collections/CollectionsPage';

describe.skip("Collections screen", () => {
    
    beforeAll(async () => {
        await CollectionsPage.initialise();
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

        await CollectionsPage.submitCreateCollectionForm();
    });

    // TODO scheduling by date
    // TODO scheduling by release
    // TODO adding teams to a collection

});