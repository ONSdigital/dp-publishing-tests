import expectPuppeteer from 'expect-puppeteer';
import Page from "../Page";
import LoginSetNewPasswordPage from './LoginSetNewPasswordPage';

export const loginPageSelectors = {
    passwordInput: "#password",
    emailInput: "#email",
    loginButton: "button[type='submit']"
};

export default class LoginPage extends Page {

    static async isLoaded() {
        return await page.$eval('h1', heading => heading.textContent === 'Login');
    }

    static async waitForLoad() {
        try {
            await page.waitForXPath("//h1[text()='Login']");
        } catch (error) {
            console.error("Error waiting for login screen to load", error);
            fail("Error waiting for login screen to load");
        }
    }

    static async load() {
        await super.goto("/login").catch(error => {
            console.error("Error navigating to login page\n", error);
        });
    } 

    static async screenshot() {
        await super.screenshot("login");
    }

    static async inputEmail(email) {
        await expectPuppeteer(page).toFill(loginPageSelectors.emailInput, email);
    }
    
    static async inputPassword(password) {
        await expectPuppeteer(page).toFill(loginPageSelectors.passwordInput, password);
    }

    static async login(email, password) {
        await this.waitForLoad();
        await this.inputEmail(email);
        await this.inputPassword(password);
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
    }

    static async updateTemporaryPassword(newPassword) {
        await LoginSetNewPasswordPage.waitForLoad();
        await expectPuppeteer(page).toFill("#new-password", newPassword)
        await expectPuppeteer(page).toClick('.btn', {text: "Update password"});
    }

}