import Page from "../Page";

export const userDetailsSelectors = {
    visibleDrawer: ".drawer.visible",
    animatedDrawer: ".drawer.visible.animation-finished",
    userName: "#user-name",
    userEmail: "#user-email",
    userRole: "#user-role",
    tempPasswordText: "#user-temporary-password",
    actionsBar: ".drawer__banner",
    actionsFooter: ".drawer__footer",
    changePasswordButton: "a[href$='change-password']",
    deleteUserButton: "a[href$='confirm-delete']",
    closeButton: "#user-close"
}

export default class UserDetailsPage extends Page {

    static async isLoaded(name) {
        const isLoaded = await page.$eval(userDetailsSelectors.userName, (heading, name) => {
            return heading.textContent === name
        }, name);

        return isLoaded;
    }

    static async isVisible() {
        return await page.$(userDetailsSelectors.visibleDrawer) !== null;
    }

    static async waitForLoad() {
        try {
            await page.waitForSelector(userDetailsSelectors.visibleDrawer);
        } catch (error) {
            console.error("Error waiting for user details to load", error);
            throw new Error('Error waiting for user details to load');
        }
    }

    static async waitForAnimationToEnd() {
        try {
            await page.waitForSelector(userDetailsSelectors.animatedDrawer, {timeout: 5000});
        } catch (error) {
            console.error("Error waiting for user details animation to end", error);
            throw new Error('Error waiting for user details animation to end');
        }
    }

    static async load(ID) {       
        await super.goto(`/users/${ID}`).catch(error => {
            console.error("Error navigating to a user's details screen\n", error);
        });
    }

    static async screenshot() {
        await super.screenshot("user-details");
    }

    static async getUsersName() {
        return await page.$eval(userDetailsSelectors.userName, element => element.textContent);
    }
    
    static async getUsersEmail() {
        return await page.$eval(userDetailsSelectors.userEmail, element => element.textContent);
    }
    
    static async getUsersRole() {
        return await page.$eval(userDetailsSelectors.userRole, element => element.textContent);
    }

    static async tempPasswordTextIsVisible() {
        return await page.$(userDetailsSelectors.tempPasswordText) !== null;
    }

    static async closeUserButtonIsVisible() {
        return await page.$(userDetailsSelectors.closeButton) !== null;
    }

    static async userActionsBarIsVisible() {
        return await page.$(userDetailsSelectors.actionsBar) !== null;
    }
    
    static async userActionsFooterIsVisible() {
        return await page.$(userDetailsSelectors.actionsFooter) !== null;
    }

    static async changePasswordButtonIsVisible() {
        return await page.$(userDetailsSelectors.changePasswordButton) !== null;
    }
    
    static async deleteUserButtonIsVisible() {
        return await page.$(userDetailsSelectors.deleteUserButton) !== null;
    }

    static async changePasswordButtonIsNotVisible () {
        return await page.waitForXPath(`//a[text()='Change password']`, {hidden: true});
    }

}