import Page from "../Page";

export default class UsersPage extends Page {

    static async isLoaded() {
        return await page.$eval('h1', heading => heading.textContent === 'Select a user');
    }

    static async load() {
        await super.goto("/users").catch(error => {
            console.error("Error navigating to login page\n", error);
        });
    } 

    static async waitForLoad() {
        await page.waitForXPath("//h1[text()='Select a user']");
    }

    static async screenshot() {
        await super.screenshot("users");
    }

    // implement click using XPath as expectPuppeteer.toClick won't work with XPath
    static async selectUser(usersEmail) {
        const selectedUser = await page.$x(`//li[@id="${usersEmail}"]`);

        if (selectedUser.length > 0) {
            await selectedUser[0].click();
        } else {
            // TODO - to make this closer to how expectPuppeteer.toClick works we could fail the test here directly with fail()
            // we should probably consider including the usersEmail in the error/log message too
            throw new Error(`Link not found for user with the ID '${usersEmail}'`);
        }
    }

    static async getActiveUserIDs() {
        try {
            return await page.$$eval('.selectable-box__item.selected', items => 
                items.map(item => item.getAttribute('id')));
                
        } catch(err) {
            console.log("No active users found");
            return [];
        }
    }

}