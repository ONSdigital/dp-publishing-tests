import CollectionsPage from '../../pages/collections/CollectionsPage';
import LoginPage from '../../pages/login/LoginPage';

describe("Collections screen", () => {
    
    beforeAll(async () => {
        await CollectionsPage.initialise();
    });

    it("loads [smoke]", async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
        expect(await CollectionsPage.isLoaded()).toBe(true);
    });
    
    it("redirects to the login screen if not logged in [smoke]", async () => {
        await CollectionsPage.revokeAuthentication();
        await CollectionsPage.load();
        expect(await LoginPage.isLoaded());
    });
    
    it("redirect to the login screen includes parameter for subsequent redirect to collections path [smoke]", async () => {
        await CollectionsPage.revokeAuthentication();
        await CollectionsPage.load();
        expect(await CollectionsPage.currentPath()).toBe("/florence/login?redirect=%2Fflorence%2Fcollections");
    });

});