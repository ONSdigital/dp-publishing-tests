import expectPuppeteer from "expect-puppeteer";
import Zebedee from "../../../clients/Zebedee";
import UsersPage from "../../pages/users/UsersPage";
import UserDetailsPage, { userDetailsSelectors } from "../../pages/users/UserDetailsPage";
import ChangeUsersPasswordPage, { changeUserPasswordSelectors } from "../../pages/users/ChangeUsersPasswordPage";
import Page from "../../pages/Page";
import LoginPage, { loginPageSelectors } from "../../pages/login/LoginPage";

const tempUsers = [{
    name: "acceptancetestuser (viewer)",
    email: "acceptancetestuserviewer@test.com",
    type: "viewer",
    confirmPassword: true
}];

beforeAll(async () => {
    await UsersPage.initialise();
    await UsersPage.revokeAuthentication();
    await UsersPage.loginAsAdmin();
    await Zebedee.createUsers(tempUsers);
});

afterAll(async () => {
    await Zebedee.deleteUsers(tempUsers);
});

describe.skip("Starting from the user's screen", () => {
    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUsers[0].email);
        await UserDetailsPage.waitForAnimationToEnd();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(true);
        await expectPuppeteer(page).toClick(userDetailsSelectors.changePasswordButton);
        await ChangeUsersPasswordPage.waitForLoad();
    });

    it("admins can successfully change a user's password", async () => {
        await expectPuppeteer(page).toFill(changeUserPasswordSelectors.passwordInput, 'new password value foobar');
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.saveButton);
        await ChangeUsersPasswordPage.waitForNotification();

        // Check that the password has actually changed for the user, by attempting to login via Florence
        await Page.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.inputEmail(tempUsers[0].email);
        await LoginPage.inputPassword('new password value foobar');
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        const response = await LoginPage.waitForRequestResponse("/zebedee/login");
        console.log(response);

        // Log back in as admin for the rest of the tests
        await UsersPage.loginAsAdmin();

        // Reset the user to default state by deleting and recreating it
        console.log("Successfully changed password, recreating temporary user to original state");
        await Zebedee.deleteUsers([tempUsers[0]]);
        await Zebedee.createUsers([tempUsers[0]]);
    });

    it("shows an error message when the password isn't valid");
    it("removes an error message when the user starts typing");
    it("cancelling changing password routes to the user's details");
});

describe.skip("Loading the 'change user's password' route directly", () => {
    it("admins can successfully change a user's password");
    it("cancelling changing password routes to the user's details");
});

describe.skip("Publisher trying to delete a user", () => {
    it("redirects them to the user's details screen on direct load of the route");
    it("can't attempt to delete a user through the user journey from the users screen");
});