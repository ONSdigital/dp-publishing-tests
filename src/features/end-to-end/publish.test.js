import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from '../../pages/collections/CollectionsPage';
import CollectionDetails, { collectionDetailsSelectors } from '../../pages/collections/CollectionDetails';
import BrowsePages from '../../pages/workspace/BrowsePages';
import CreatePage from '../../pages/workspace/CreatePage';

describe("Publishing", () => {
    
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

    it("a manual collection", async () => {
        await CollectionsPage.fillCreateCollectionForm({
            name: "Acceptance test - end-to-end manual publish",
            releaseType: "manual",
        });

        const newCollection = await CollectionsPage.submitCreateCollectionForm();
        CollectionsPage.addCreatedCollectionID(newCollection.id);
        
        await CollectionDetails.waitForLoad();
        await expectPuppeteer(page).toClick(collectionDetailsSelectors.createEditPage);
        
        await BrowsePages.waitForLoad();

        // TODO we need to check these theme pages exist beforehand and create them if they don't
        await BrowsePages.clickPageByURL("/economy");
        await BrowsePages.clickPageByURL("/economy/grossdomesticproductgdp");
        const selectedPage = await BrowsePages.getSelectedPageElement();
        await expectPuppeteer(selectedPage).toClick('.btn-browse-create');
        
        // await CreatePage.waitForLoad();
        // await page.select('#pagetype', 'bulletin');

        // await page.waitFor(2000);
        // await expectPuppeteer(page).toFillForm('.workspace-create form', {
        //     edition: "TEST",
        //     pagename: "Acceptance test - end-to-end manual bulletin publish"
        // });
        await BrowsePages.screenshot("create-page");
    });

});