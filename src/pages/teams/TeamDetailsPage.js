import Page from "../Page";

export const teamDetailsSelectors = {
    visibleDrawer: ".drawer.visible.animation-finished",
    animatedDrawer: ".drawer.visible.animation-finished",
    teamName: "#team-name",
    userEmail: "#user-email",
    userRole: "#user-role",
    tempPasswordText: "#user-temporary-password",
    actionsBar: ".drawer__banner",
    actionsFooter: ".drawer__footer",
}

export default class TeamDetailsPage extends Page {

    static async isLoaded(name) {
        const isLoaded = await page.$eval('.drawer h2', (heading, name) => {
            return heading.textContent === name
        }, name);

        return isLoaded;
    }

    static async waitForLoad() {
        try {
            await page.waitForXPath(`//*[contains(@class, "drawer__heading")]//button[contains(text(),'Add / remove members')]`);
        } catch (error) {
            console.error("Error waiting for teams details to load", error);
            fail('Error waiting for teams details to load');
        }
    }

    static async load(ID) {       
        await super.goto(`/teams/${ID}`).catch(error => {
            console.error("Error navigating to a team's details screen\n", error);
        });
    }

    static async screenshot() {
        await super.screenshot("team-details");
    }
}