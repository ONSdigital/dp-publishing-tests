import expectPuppeteer from 'expect-puppeteer';
import dateFormat from 'dateformat';

import CollectionsPage from '../../pages/collections/CollectionsPage';
import CollectionDetails from '../../pages/collections/CollectionDetails';
import CollectionEdit from '../../pages/collections/CollectionEdit';
import CollectionRestoreContent from '../../pages/collections/CollectionRestoreContent'
import BrowsePages from '../../pages/workspace/BrowsePages'
import EditPage from '../../pages/workspace/EditPage'
import Zebedee from '../../../clients/Zebedee'

const tempCollectionData = [
    {
        name: "Acceptance test collection for collection detail test with page",
        publishDate: null,
        releaseUri: null,
        teams: [],
        type: "manual",
        collectionOwner: "ADMIN"
    },
    {
        name: "Acceptance test collection for collection detail test without page",
        publishDate: null,
        releaseUri: null,
        teams: [],
        type: "manual",
        collectionOwner: "ADMIN"
    },
];

const tempPageData = {
    description: {
        title: "Test page for collection details acceptance tests",
        summary: "",
        releaseDate: "2018-07-05T11:54:32.259Z",
        keywords: [],
        metaDescription: ""
    },
    markdown: [],
    charts: [],
    tables: [],
    equations: [],
    images: [],
    downloads: [],
    type: "static_page",
    anchors: [],
    links: [],
    fileName: "testpageforcollectiondetailsacceptancetests",
    uri: "/aboutus/testpageforcollectiondetailsacceptancetests"
}

let testCollections = [];
let testPage;

describe("Viewing collection details", () => {

    beforeAll(async () => {
        await CollectionsPage.initialise();
        console.log("Automatically creating test collection");
        testCollections = await CollectionsPage.setupCollectionsList(tempCollectionData);
        testPage = await Zebedee.createPage(testCollections[0].id, tempPageData);
        testPage.formattedPageCreationDate = dateFormat(testPage.pageCreationDate, "ddd d mmm yyyy - HH:MM:ss")
    });

    afterAll(async () => {
        await Zebedee.deletePage(testCollections[0].id, tempPageData);
        await CollectionsPage.cleanupCollectionsList();
    });

    beforeEach(async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
    });

    it(`/[collectionID] displays the collection details`, async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad()
        const isLoaded = await CollectionDetails.isLoaded(testCollections[0].name);
        expect(isLoaded).toBeTruthy();
    })

    it('clicking close button removes collection details pane and routes to collection screen', async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad()
        await expectPuppeteer(page).toClick('button', {text: "Close"});
        await CollectionDetails.waitForDrawerToClose()
        const drawerIsVisible = await CollectionDetails.drawerIsVisible()
        expect(drawerIsVisible).toBeFalsy();
        await page.waitFor(350); // wait for drawer animation
        await CollectionsPage.waitForLoad();
        expect(await CollectionsPage.currentPath()).toBe('/florence/collections');
    })

    it('clicking create/edit loads work space', async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad()
        await expectPuppeteer(page).toClick('a', {text: "Create/edit page"});
        await BrowsePages.waitForLoad();
        expect(await CollectionsPage.currentPath()).toBe('/florence/workspace');
    })
    
    it('clicking restore page loads restore content modal', async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad()
        await expectPuppeteer(page).toClick('button', {text: "Restore page"});
        await CollectionRestoreContent.waitForLoad();
        expect(await CollectionsPage.currentPath()).toBe(`/florence/collections/${testCollections[0].id}/restore-content`);
        const isLoaded = await CollectionRestoreContent.isLoaded();
        expect(isLoaded).toBeTruthy();
    })

    it('clicking edit loads edit collection pane', async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad()
        await expectPuppeteer(page).toClick('a', {text: "Edit"});
        await CollectionEdit.waitForLoad();
        expect(await CollectionsPage.currentPath()).toBe(`/florence/collections/${testCollections[0].id}/edit`);
        const isLoaded = await CollectionEdit.isLoaded();
        expect(isLoaded).toBeTruthy();
    })

    it('delete button is not shown when collection has content', async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad()
        const deleteIsVisible = await CollectionDetails.deleteButtonIsVisible();
        expect(deleteIsVisible).toBeFalsy();
    })

    it("clicking a page item shows page details", async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad();
        let pageDetailsAreHidden = await CollectionDetails.pageOptionsAreHidden();
        expect(pageDetailsAreHidden).toBeTruthy();
        await expectPuppeteer(page).toClick('li.list__item.list__item--expandable', {text: tempPageData.description.title});
        const pageDetailsAreVisible = await CollectionDetails.pageOptionsAreVisible();
        expect(pageDetailsAreVisible).toBeTruthy();
    })

    it("page details are displayed correctly", async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad();
        await expectPuppeteer(page).toClick('li.list__item.list__item--expandable', {text: tempPageData.description.title});
        expect(await expectPuppeteer(page).toMatchElement('div.page', { text: tempPageData.description.title }));
        const lastEditTextIsCorrect = await CollectionDetails.lastEditTextIsCorrect(process.env.ROOT_ADMIN_EMAIL, testPage.formattedPageCreationDate);
        expect(lastEditTextIsCorrect).toBeTruthy();
    })

    it("can edit a file in a collection", async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad();
        await expectPuppeteer(page).toClick('li.list__item.list__item--expandable');
        await expectPuppeteer(page).toClick('button', {text: "Edit"});
        await EditPage.waitForLoad();
        expect(await CollectionsPage.currentPath()).toBe('/florence/workspace');
    })

    it("can delete file from collection", async () => {
        await CollectionDetails.goto(`/collections/${testCollections[0].id}`);
        await CollectionDetails.waitForLoad();
        await expectPuppeteer(page).toClick('li.list__item.list__item--expandable');
        expect(await expectPuppeteer(page).toMatchElement('h3', { text: '1 page in progress' }));
        await expectPuppeteer(page).toClick('button', {text: "Delete"});
        expect(await expectPuppeteer(page).toMatchElement('h3', { text: '0 pages in progress' }));
        await CollectionDetails.waitForNotification();
        await expectPuppeteer(page).toClick('button.notifications__button', {text: "OK"})
        await CollectionDetails.notificationsAreHidden()
        const zebedeeCollectionDetails = await Zebedee.getCollectionDetails(testCollections[0].id);
        expect(zebedeeCollectionDetails.inProgress.length).toEqual(0);
    })

    it('clicking delete on an empty collection deletes the collection and displays notifcation', async () => {
        await CollectionDetails.goto(`/collections/${testCollections[1].id}`);
        await CollectionDetails.waitForLoad();
        const deleteIsVisible = await CollectionDetails.deleteButtonIsVisible();
        expect(deleteIsVisible).toBeTruthy();
        await expectPuppeteer(page).toClick('button#delete-collection', {text: "Delete"});
        await CollectionDetails.waitForDrawerToClose()
        const drawerIsVisible = await CollectionDetails.drawerIsVisible()
        expect(drawerIsVisible).toBeFalsy();
        await CollectionsPage.waitForLoad();
        expect(await CollectionsPage.currentPath()).toBe('/florence/collections');
        await CollectionDetails.waitForNotification();
        expect(await expectPuppeteer(page).toMatchElement('.notifications__item', { text: `Collection deleted` }));
        const collectionExists = await Zebedee.collectionExists(testCollections[1].id);
        expect(collectionExists).toBeFalsy() 
        const collectionExistsInCollectionList = await CollectionDetails.collectionExistsInCollectionList(testCollections[1].i);
        expect(collectionExistsInCollectionList).toBeFalsy() 
    })
})