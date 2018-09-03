import expectPuppeteer from 'expect-puppeteer';

import Page from "../../pages/Page";
import UsersPage from '../../pages/users/UsersPage';
import UserDetails from '../../pages/users/UserDetailsPage';
import Zebedee from '../../../clients/Zebedee'

const tempUsers = [
    {
        name: "acceptancetestuser1",
        email: "acceptancetestuser1@test.com"
    }, {
        name: "acceptancetestuser2",
        email: "acceptancetestuser2@test.com"
    }, {
        name: "acceptancetestuser3",
        email: "acceptancetestuser3@test.com"
    }
];

beforeAll(async () => {
    await Zebedee.createUsers(tempUsers);
});

afterAll(async ()=> {
    await Zebedee.deleteUsers(tempUsers)
})

describe("Users screen", () => {
    
    it("loads [smoke]", async () => {
        await UsersPage.initialise();
        await UsersPage.load();
        await UsersPage.waitForLoad();
        expect(await UsersPage.isLoaded()).toBe(true);
    });
});

describe("List of users", () => {
    beforeAll(async () => {
        await UsersPage.initialise();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
    });
    
    it("shows a user item as active when clicked", async () => {
        await UsersPage.selectUser(tempUsers[0].email);
        const activeUserIDs = await UsersPage.getActiveUserIDs();
        expect(activeUserIDs.length).toBe(1);
        expect(activeUserIDs[0] === tempUsers[0].email).toBe(true);
    });

    it("updates the URL correctly when a user is clicked", async () => {
        await UsersPage.selectUser(tempUsers[0].email);
        await page.waitForNavigation();
        expect(await UsersPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`)
    });

    it("displays the user details drawer when a user is clicked", async () => {
        await UsersPage.selectUser(tempUsers[0].email);
        await page.waitForNavigation();
        await UserDetails.waitForLoad();
        const isLoaded = await UserDetails.isLoaded(tempUsers[0].name);
        expect(isLoaded).toBe(true);
    });
});

describe("Admin users", () => {
    beforeAll(async () => {
        await UsersPage.initialise();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
    });

    it("see create form", async () => {
        await expect(page).toMatchElement('h1', { text: 'Create a user' })
    })
});

describe("Non admin users", () => {
    beforeAll(async () => {
        await Page.initialise(true);
        await Page.loginAsPublisher();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
    });

    it("get redirected to own user screen", async () => {
        expect(await UsersPage.currentPath()).toBe(`/florence/users/${Zebedee.getTempPublisherUserEmail()}`)
    });

})