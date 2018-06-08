export const navBarSelectors = {
    navBar: ".global-nav__list"
};

export default class NavBar {

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

}