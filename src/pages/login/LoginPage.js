import Page from "../Page";

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
        await page.type(loginPageSelectors.emailInput, email);
    }
    
    static async inputPassword(password) {
        await page.type(loginPageSelectors.passwordInput, password);
    }
}