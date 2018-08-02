import expectPuppeteer from 'expect-puppeteer';

import CollectionsPage from '../../pages/collections/CollectionsPage';
import Zebedee from '../../../clients/Zebedee'

import Page from "../../pages/Page";
import PreviewPage from "../../pages/preview/PreviewPage";

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
    { name: "AccTest Team 1" },
    { name: "AccTest Team 2" }
]

let testCollections = []
let testPage = {}

describe("A viewer", () => {
    beforeAll(async () => {
        await Page.initialise(true);
        await Page.loginAsViewer();
    });

    it("can access collections screen", async () => {
        await Page.goto(`/collections`);
        await CollectionsPage.waitForLoad();
        const isLoaded = await CollectionsPage.isLoaded();
        expect(isLoaded).toBeTruthy;
    })

    it("can't access 'Publishing queue' screen and is redirected to ", async () => {
        await Page.goto(`/publishing-queue`);
        await CollectionsPage.waitForLoad();
        const isLoaded = await CollectionsPage.isLoaded();
        expect(isLoaded).toBeTruthy;
    })

    it("can't access 'Reports' screen and is redirected to ", async () => {
        await Page.goto(`/reports`);
        await CollectionsPage.waitForLoad();
        const isLoaded = await CollectionsPage.isLoaded();
        expect(isLoaded).toBeTruthy;
    })

    it("can't access 'User and access' screen and is redirected to ", async () => {
        await Page.goto(`/users-and-access`);
        await CollectionsPage.waitForLoad();
        const isLoaded = await CollectionsPage.isLoaded();
        expect(isLoaded).toBeTruthy;
    })

    it("can't access 'Teams' screen and is redirected to ", async () => {
        await Page.goto(`/teams`);
        await CollectionsPage.waitForLoad();
        const isLoaded = await CollectionsPage.isLoaded();
        expect(isLoaded).toBeTruthy;
    })
});