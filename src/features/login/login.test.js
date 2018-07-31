import expectPuppeteer from 'expect-puppeteer';

import LoginPage, { loginPageSelectors } from '../../pages/login/LoginPage';
import CollectionsPage from '../../pages/collections/CollectionsPage';
import NavBar from '../../pages/global/NavBar';
import Page from '../../pages/Page';

describe('Login screen', async () => {

    beforeAll(async () => {
        await LoginPage.initialise(true);
    });

    beforeEach(async() => {
        await LoginPage.load();
    });

    afterEach(async() => {
        await Page.revokeAuthentication();
    })
    
    it("loads [smoke]", async () => {
        expect(await LoginPage.isLoaded()).toBe(true);
    });

    it("user can log in [smoke]", async () => {
        await LoginPage.inputEmail(process.env.ROOT_ADMIN_EMAIL);
        await LoginPage.inputPassword(process.env.ROOT_ADMIN_PASSWORD);
        await expectPuppeteer(page).toClick('button', {text: 'Log in'})
        await CollectionsPage.waitForLoad();
        expect(await CollectionsPage.isLoaded()).toBe(true);
    });

    it("email & password fields update values on input", async () => {
        const email = 'test@gmail.com';
        const password = 'this is a test';
        
        await LoginPage.inputEmail(email);
        await LoginPage.inputPassword(password);

        const {emailValue, passwordValue} = await page.evaluate(loginPageSelectors => {
            return {
                emailValue: document.querySelector(loginPageSelectors.emailInput).value, 
                passwordValue: document.querySelector(loginPageSelectors.passwordInput).value
            };
        }, loginPageSelectors);

        expect(emailValue).toBe(email);
        expect(passwordValue).toBe(password);
    });

    it("show the plain text password on 'Show password'", async () => {
        const password = "an example password";
        await LoginPage.inputPassword(password);

        await expectPuppeteer(page).toMatchElement(loginPageSelectors.passwordInput + '[type="password"]');
        await expectPuppeteer(page).toClick('*[role="button"]', {text: 'Show'});
        await expectPuppeteer(page).toMatchElement(loginPageSelectors.passwordInput + '[type="text"]');
    });
    
    it("hide the plain text password on 'Hide password'", async () => {
        const password = "an example password";
        await LoginPage.inputPassword(password);

        await expectPuppeteer(page).toClick('*[role="button"]', {text: 'Show'});
        await expectPuppeteer(page).toMatchElement(loginPageSelectors.passwordInput + '[type="text"]');
        await expectPuppeteer(page).toClick('*[role="button"]', {text: 'Hide'});
        await expectPuppeteer(page).toMatchElement(loginPageSelectors.passwordInput + '[type="password"]'); 
    });

    it("doesn't display links in the nav bar to any other global Florence screens", async () => {
        expect(await NavBar.containsLink("collections")).toBe(false);
        expect(await NavBar.containsLink("publishing queue")).toBe(false);
        expect(await NavBar.containsLink("reports")).toBe(false);
        expect(await NavBar.containsLink("users")).toBe(false);
        expect(await NavBar.containsLink("teams")).toBe(false);
    });

    it("shows 'Login' in the nav bar as active", async () => {
        let containsLink = await NavBar.containsLink("login");
        await expect(containsLink).toBe(true);
    });

    

    // TODO test errors and validation
    // TODO test successful login
    // TODO login page redirects to collections screen if already logged in
    // TODO login screen redirects to original URL (if available) or collections by default on successful login
});