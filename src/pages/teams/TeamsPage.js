import expectPuppeteer from 'expect-puppeteer';

import TeamDetails from '../../pages/teams/TeamDetailsPage';

import Page from "../Page";

export default class TeamsPage extends Page {

    static async isLoaded() {
        return await page.$eval('h1', heading => heading.textContent === 'Select a team');
    }

    static async load() {
        await super.goto("/teams").catch(error => {
            console.error("Error navigating to login page\n", error);
        });
    } 

    static async waitForLoad() {
        try {
            await page.waitForXPath("//h1[text()='Select a team']");
            await page.waitForSelector(`.loader.selectable-box__status`, {hidden: true});
        } catch (error) {
            console.error("Error waiting for users screen to load", error);
            fail("Error waiting for users screen to load");
        }
    }

    // implement click using XPath as expectPuppeteer.toClick won't work with XPath
    static async selectTeam(teamName) {

        const selectedTeam = await page.$x(`//li[contains(@class, 'selectable-box__item') and text() = '${teamName}']`);

        if (selectedTeam.length > 0) {
            try {
                const waitForNavigation = page.waitForNavigation();
                await selectedTeam[0].click();
                await waitForNavigation;
            } catch (error) {
                console.error(`Error clicking link for user with the ID '${teamName}'`, error);
                fail(`Error clicking link for user with the ID '${teamName}'`);
            }
        } else {
            throw new Error(`Link not found for user with the ID '${teamName}'`);
        }
    }

    static async screenshot() {
        await super.screenshot("teams");
    }

    static async createTeam(teamName) {
        await expectPuppeteer(page).toFillForm('form[name="create-new-team"]', {
            name: teamName
        });
        await expectPuppeteer(page).toClick('button', { text: 'Create' });
        return page.waitForResponse(`${process.env.PUBLISHING_ENV_URL}/zebedee/teams/${teamName}`);
    }

}