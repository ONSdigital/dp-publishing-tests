import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from '../../pages/collections/CollectionsPage';
import CollectionDetails, { collectionDetailsSelectors } from '../../pages/collections/CollectionDetails';
import BrowsePages, { browsePagesSelector } from '../../pages/workspace/BrowsePages';
import CreatePage, { createPageSelectors } from '../../pages/workspace/CreatePage';
import EditPage, { editPageSelectors } from '../../pages/workspace/EditPage';
import Zebedee from '../../../clients/Zebedee';
import Page from '../../pages/Page';
import PublishQueuePage, { publishQueueSelectors } from '../../pages/publish-queue/PublishQueuePage';


describe("Publishing end-to-end", () => {
    
    beforeAll(async () => {
        await CollectionsPage.initialise();
    });

    afterAll(async () => {
        const tempCollection = await Zebedee.deletePublishedPage("/economy/grossdomesticproductgdp/bulletins/acceptancetestendtoendmanualbulletinpublish/test");
        CollectionsPage.addCreatedCollectionID(tempCollection.id);

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
        await BrowsePages.waitForPageSelection("/economy");
        await BrowsePages.clickPageByURL("/economy/grossdomesticproductgdp");
        await BrowsePages.waitForPageSelection("/economy/grossdomesticproductgdp");

        // We have to check that the preview's content window has updated it's location.href value.
        // if it hasn't updated yet then the create page screen can break because Florence checks the location
        // that a page is being created under, but will get an old page and state that the bulletin
        // cannot be created there.
        await BrowsePages.waitForPreviewToLoadURL("/economy/grossdomesticproductgdp");

        const selectedPage = await BrowsePages.getSelectedPageElement();
        await expectPuppeteer(selectedPage).toClick(browsePagesSelector.createButton);
        
        await CreatePage.waitForLoad();
        await page.select(createPageSelectors.pageTypeSelect, 'bulletin');

        try {
            await page.waitForSelector(createPageSelectors.editionInput, {visible: true});
        } catch (error) {
            console.error("Error waiting for 'Edit' page button to display", error);
            fail("Failed waiting for 'Edit' page button to display");
        }

        await CreatePage.fillCreatePageForm({
            edition: "TEST",
            name: "Acceptance test - end-to-end manual bulletin publish"
        });
    
        await expectPuppeteer(page).toClick(createPageSelectors.submitButton);

        // Check that an error message isn't showing, this is because sometime we'll
        // get errors if the same page exists
        const createPageError = await Page.hasGlobalErrorMsg();
        expect(createPageError).toBe(false);

        await EditPage.waitForLoad();
        await expectPuppeteer(page).toClick(editPageSelectors.submitForReviewButton);
        
        await CollectionDetails.waitForLoad();

        // Simulates logging in as another user, so that we can review the page we just submitted for review
        await Page.setAccessTokenCookie(Zebedee.getAdminAccessToken());
        await Page.setSessionEmailLocalStorage(Zebedee.getAdminUserEmail());

        await expectPuppeteer(page).toClick(collectionDetailsSelectors.pageItem, {text: "Acceptance test - end-to-end manual bulletin publish"});
        await expectPuppeteer(page).toClick(collectionDetailsSelectors.pageActionButton, {text: "Review"});

        await EditPage.waitForLoad();
        await expectPuppeteer(page).toClick(editPageSelectors.submitForApprovalButton);

        await CollectionDetails.waitForLoad();
        const collectionID = await CollectionDetails.getActiveCollectionID();
        await expectPuppeteer(page).toClick(collectionDetailsSelectors.approveCollection, {text: "Approve"});
        await CollectionsPage.waitForCollectionToDisappear(collectionID);

        await expectPuppeteer(page).toClick('.global-nav__list a', {text: 'Publishing queue'});
        await PublishQueuePage.waitForLoad();
        await expectPuppeteer(page).toClick('td', {text: '[manual collection]'});
        
        // NOTE: we're having to wait for the animation to finish with a simple timer.
        // Sadly we can't be smarter and wait for a selector because the animation is done 
        // without any class/selector changes to wait for.
        // It instead it uses JS to amend the style attribute directly on the element :'(
        await page.waitFor(1000);

        // We have to get the element itself and click it, rather than simply using a selector
        // because the only unique element we can get from the DOM has event propagation disabled
        // on it, so the click event doesn't bubble up to the necessary element that handles it.
        const collectionTitle = await PublishQueuePage.collectionAccordionTitleElement(collectionID);
        await expectPuppeteer(collectionTitle).toClick('*');

        // There's an animation on the accordion that we can't wait for a selector on (similar to the comment above)
        // so we just have to pause until the animation is finished
        await page.waitFor(1000);
        
        await expectPuppeteer(page).toClick(publishQueueSelectors.collectionAction, {text: "Publish collection"});
    

        const hasPublished = await PublishQueuePage.collectionHasPublished(collectionID);
        expect(hasPublished).toBe(true);
    });

});