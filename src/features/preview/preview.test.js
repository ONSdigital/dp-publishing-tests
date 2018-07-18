import expectPuppeteer from 'expect-puppeteer';

import Page from "../../pages/Page";
import PreviewPage from "../../pages/preview/PreviewPage";

describe("Preview a collection", () => {
    beforeAll(async () => {
        await Page.initialise(true);
        await Page.loginAsViewer();
    });

    it("loads", async () => {
        await PreviewPage.load();
        await expectPuppeteer(page).toMatch("Sorry, this page couldn't be found");
    });
});