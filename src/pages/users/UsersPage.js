import expectPuppeteer from 'expect-puppeteer';

import UserDetails from '../../pages/users/UserDetailsPage';

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
        try {
            await page.waitForXPath("//h1[text()='Select a user']");
            await page.waitForSelector(`.loader.selectable-box__status`, {hidden: true});
        } catch (error) {
            console.error("Error waiting for users screen to load", error);
            fail("Error waiting for users screen to load");
        }
    }

    static async screenshot() {
        await super.screenshot("users");
    }

    // implement click using XPath as expectPuppeteer.toClick won't work with XPath
    static async selectUser(usersEmail) {
        const selectedUser = await page.$x(`//li[@id="${usersEmail}"]`);

        if (selectedUser.length > 0) {
            try {
                const waitForNavigation = page.waitForNavigation();
                await selectedUser[0].click();
                await waitForNavigation;
            } catch (error) {
                console.error(`Error clicking link for user with the ID '${usersEmail}'`, error);
                fail(`Error clicking link for user with the ID '${usersEmail}'`);
            }
        } else {
            throw new Error(`Link not found for user with the ID '${usersEmail}'`);
        }
    }

    static async getAllUserNamesAndIDs() {
        return await page.$$eval('.selectable-box__item', users => (
            users.map(user => ({
                id: user.getAttribute('id'),
                name: user.querySelector('*[class^="grid__col"], *[class*=" grid__col"]').textContent
            }))
        ));
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

    static async fillCreateUserForm(user) {
        await expectPuppeteer(page).toFillForm('form[name="create-new-user"]', {
            username: user.username,
            email: user.email,
            password: user.password
        });

        if (!user.type) {
            return
        }

        if (user.type === "admin") {
            await expectPuppeteer(page).toClick('input[id="admin"]');
            return
        }

        if (user.type === "publisher") {
            await expectPuppeteer(page).toClick('input[id="publisher"]');
            return
        }

        if (user.type === "viewer") {
            await expectPuppeteer(page).toClick('input[id="viewer"]');
            return
        }
    }

    static async createUser(user, userType) {
        await this.fillCreateUserForm( {
            ...user,
            type: userType 
        });
        await expectPuppeteer(page).toClick('button', { text: 'Create user' });
        await UserDetails.waitForLoad();
    }

}