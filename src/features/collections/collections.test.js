import expectPuppeteer from 'expect-puppeteer';
import CollectionsPage from '../../pages/collections/CollectionsPage';

describe("Collections screen", () => {
    
    beforeAll(async () => {
        await CollectionsPage.initialise();
    });
    
    beforeEach(async () => {
        await CollectionsPage.goto();
    });

    it("loads [smoke]", async () => {
        expect(await CollectionsPage.isLoaded()).toBe(true);
    });

});