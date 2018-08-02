import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from '../../pages/collections/CollectionsPage';
import Zebedee from '../../../clients/Zebedee'

import Page from "../../pages/Page";
import PreviewPage from "../../pages/preview/PreviewPage";
import NavBar, { navBarSelectors } from '../../pages/global/NavBar';

const tempCollectionData = [
    {
        name: "Acceptance test collection for preview test",
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

const tempTeams = [
    {name: "AccTest Team 1"},
    {name: "AccTest Team 2"}
]

let testCollections = []
let testPage = {}

describe.only("Previewing a collection with access", () => {
    beforeAll(async () => {
        await Page.initialise(true);
        testCollections = await CollectionsPage.setupCollectionsList(tempCollectionData);
        await Zebedee.createTeam(tempTeams[0].name);
        await Zebedee.addTeamToCollection(tempTeams[0].name, testCollections[0].id)
        await Zebedee.addUserToTeam(tempTeams[0].name, Zebedee.getTempViewerUserEmail())
        testPage = await Zebedee.createPage(testCollections[0].id, tempPageData);
        await Page.loginAsViewer();
    });

    beforeEach(async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
    });

    afterAll(async () => {
        await CollectionsPage.cleanupCreatedCollections();
        await Zebedee.deleteTeam(tempTeams[0].name);
        await Zebedee.deleteTeam(tempTeams[1].name);
    });

    it("loads", async () => {
        await PreviewPage.load(testCollections[0].id);
        await expectPuppeteer(page).toMatchElement('#iframe');
    });

    it("user with access to collections can see collections they have access to", async () => {
        const collections = await CollectionsPage.getAllCollectionsInList();
        expect(collections.length).toBe(1);
        expect(collections[0].name).toBe(testCollections[0].name);
    });

    it("clicking a collection loads preview", async () => {
        await expectPuppeteer(page).toClick(`#${testCollections[0].id}`);
        await expectPuppeteer(page).toMatchElement('#iframe');
    });

    it("user can select pages and view content in preview", async () => {
        let iframeTitle;
        await PreviewPage.load(testCollections[0].id);
        await expectPuppeteer(page).toMatchElement('#iframe');
        const frames = await page.frames();
        expect(await PreviewPage.getIframeSrc()).toBe("/");
        expect(await Page.currentPath()).toBe(`/florence/collections/${testCollections[0].id}/preview`);
        iframeTitle = await PreviewPage.iframeContentHasCorrectTitle(await frames[1].content());
        expect(iframeTitle).toBe("Home");
        await expectPuppeteer(page).toSelect('#preview-select', testPage.description.title);
        expect(await PreviewPage.getIframeSrc()).toBe(testPage.uri);
        expect(await Page.currentPath()).toEqual(`/florence/collections/${testCollections[0].id}/preview?url=${testPage.uri}`);
        await frames[1].waitForSelector('.static_page')
        iframeTitle = await PreviewPage.iframeContentHasCorrectTitle(await frames[1].content());
        expect(iframeTitle).toBe(testPage.description.title)
    });

    it("clicking a collection shows the 'Working on' tab in the navbar, with the collection name", async () => {
        await expectPuppeteer(page).toClick(`#${testCollections[0].id}`);
        const title = await NavBar.getWorkingOnTitle();
        expect(title).toBe(testCollections[0].name);
    });
    
    it("routing directly to preview the 'Working on' tab shows a loading icon then the collection name", async () => {
        await PreviewPage.load(testCollections[0].id);
        await expectPuppeteer(page).toMatchElement(`${navBarSelectors.workingOn} .loader`);
    });

    it("doesn't display the preview page selector for the route '/florence/preview'");
});

describe("Trying to preview without access", () => {
    beforeAll(async () => {
        await Page.initialise(true);
        testCollections = await CollectionsPage.setupCollectionsList(tempCollectionData);
        await Page.loginAsViewer();
    });

    afterAll(async () => {
        await CollectionsPage.cleanupCreatedCollections();
    });

    it("preview doesn't load, shows and error and redirects user to collections screen", async () => {
        await PreviewPage.load(testCollections[0].id);
        await expectPuppeteer(page).toMatchElement('.notifications__item', { text: 'You do not have permission to view this data, so you have been redirected to the collections screen' });
        expect(await CollectionsPage.currentPath()).toBe(`/florence/collections`);
    });

    it("user with access to no collections see no collections when logging in", async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
        const collections = await CollectionsPage.getAllCollectionsInList();
        expect(collections.length).toBe(0);
    });

    it("doesn't display the preview page selector for the route '/florence/preview'");
})

describe("Trying to view preview for a collection that doesn't exist", () => {
    beforeAll(async () => {
        await Page.initialise(true);
        await Page.loginAsViewer();
    });

    it("redirects to the collections screen and displays an error", async () => {
        await PreviewPage.load("collection-that-doesnt-exist-id");
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
        const isLoaded = await CollectionsPage.isLoaded();
        expect(isLoaded).toBeTruthy;
    });
})