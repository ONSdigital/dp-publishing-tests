import Page from "../Page";

export const loginPageSelectors = {
    passwordInput: "#password",
    emailInput: "#email"
};

export default class LoginPage extends Page {

    static async isLoaded() {
        const isLoaded = await page.$$eval('h1', headings => headings.map(heading => {
            return heading.innerText;
        }));
        return isLoaded.length > 0;
    }

    static async goto() {
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