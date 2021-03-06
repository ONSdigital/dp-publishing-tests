export const navBarSelectors = {
    navBar: ".global-nav__list",
    workingOn: ".global-nav__item--working-on"
};

export default class NavBar {

    static async isLoaded() {
        try {
            await page.waitForSelector(navBarSelectors.navBar, {timeout: 5000});
            return true;
        } catch (err) {
            return false;
        }
    }

    static async containsLink(screenName) {
        let screenURL = "";
        switch (screenName) {
            case("collections"): {
                screenURL = "/collections"
                break;
            }
            case("publishing queue"): {
                screenURL = "/publishing-queue"
                break;
            }
            case("reports"): {
                screenURL = "/reports"
                break;
            }
            case("users"): {
                screenURL = "/users-and-access"
                break;
            }
            case("teams"): {
                screenURL = "/teams"
                break;
            }
            case("login"): {
                screenURL = "/login"
                break;
            }
            default: {
                throw `Attempt to check existence of link in the nav bar to an unrecognised screen name: "${screenName}"`;
                break;
            }
        }

        return await page.$$eval(`${navBarSelectors.navBar} a[href="/florence${screenURL}"]`, links => links.length > 0);
    }

    static async linkIsActive(screenName) {

    }

    static async getWorkingOnTitle() {
        const text = await page.$eval(navBarSelectors.workingOn, element => element.textContent);
        return text.replace(/Working on:\u00a0/, "");
    }

    static async previewPageSelectorIsShowing() {
        try {
            await page.waitForSelector('#preview-select', {timeout: 2000});
            return true;
        } catch (err) {
            return false;
        }
    }

}