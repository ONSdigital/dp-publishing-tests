import expectPuppeteer from "expect-puppeteer";
import Page from "../../pages/Page";
import Zebedee from "../../../clients/Zebedee";
import UsersPage from "../../pages/users/UsersPage";
import UserDetailsPage, { userDetailsSelectors } from "../../pages/users/UserDetailsPage";
import ConfirmDeleteUserPage, { deleteUserSelector } from "../../pages/users/ConfirmDeleteUserPage";

const tempUsers = [{
    name: "acceptancetestuser (viewer)",
    email: "acceptancetestuserviewer@test.com",
    type: "viewer",
    confirmPassword: true
}];

beforeAll(async () => {
    await Page.initialise();
    await UsersPage.revokeAuthentication();
    await UsersPage.loginAsAdmin();
    await Zebedee.createUsers(tempUsers);
});

afterAll(async () => {
    await Zebedee.deleteUsers(tempUsers);
});

describe("Starting from the user's screen", () => {
    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUsers[0].email);
        await UserDetailsPage.waitForAnimationToEnd();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(true);
        await expectPuppeteer(page).toClick(userDetailsSelectors.deleteUserButton);
        await ConfirmDeleteUserPage.waitForLoad();
    });

    it("animates showing the user's details", async () => {
        
    });
});