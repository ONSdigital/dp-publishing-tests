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
    await Zebedee.createUsers(tempUsers);
});

afterAll(async () => {
    await Zebedee.deleteUsers(tempUsers);
});

describe("Starting from the user's screen", () => {
    beforeEach(async () => {
        await UsersPage.revokeAuthentication();
        await UsersPage.loginAsAdmin();
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
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.inputEmail(tempUsers[0].email);

        // Whilst we're here check that an incorrect password still gives the same response
        await LoginPage.inputPassword('foobar');
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        let response;
        try {
            response = await LoginPage.waitForRequestResponse("/zebedee/login");
        } catch (error) {
            console.error("Error waiting for response from login attempt", error);
            fail("Error waiting for response from login attempt");
        }
        expect(response.status()).toBe(401);

        // Now attempt to login with new password
        await LoginPage.inputPassword('new password value foobar');
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        try {
            response = await LoginPage.waitForRequestResponse("/zebedee/login");
        } catch (error) {
            console.error("Error waiting for response from login attempt", error);
            fail("Error waiting for response from login attempt");
        }
        expect(response.status()).toBe(417);

        // Log back in as admin for the rest of the tests
        await UsersPage.loginAsAdmin();

        // Reset the user to default state by deleting and recreating it
        console.log("Successfully changed password, recreating temporary user to original state");
        await Zebedee.deleteUsers([tempUsers[0]]);
        await Zebedee.createUsers([tempUsers[0]]);
    });

    it("shows an error message when the password isn't valid", async () => {
        await expectPuppeteer(page).toFill(changeUserPasswordSelectors.passwordInput, 'foobar');
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.saveButton);
        expect(await ChangeUsersPasswordPage.errorMessageIsVisible()).toBe(true);
        expect(await ChangeUsersPasswordPage.getInlineErrorMessage()).toBe("Passwords must contain four words, separated by spaces");
    });

    it("removes an error message when the user starts typing", async () => {
        await expectPuppeteer(page).toFill(changeUserPasswordSelectors.passwordInput, 'foobar');
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.saveButton);
        expect(await ChangeUsersPasswordPage.errorMessageIsVisible()).toBe(true);
        expect(await ChangeUsersPasswordPage.getInlineErrorMessage()).toBe("Passwords must contain four words, separated by spaces");

        await expectPuppeteer(page).toFill(changeUserPasswordSelectors.passwordInput, 'a');
        expect(await ChangeUsersPasswordPage.errorMessageIsVisible()).toBe(false);
    });

    it("cancelling changing password routes to the user's details", async () => {
        const waitForNavigation = page.waitForNavigation();
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.cancelButton);
        await waitForNavigation;
        expect(await ChangeUsersPasswordPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });
});

describe("Loading the 'change user's password' route directly", () => {

    beforeEach(async () => {
        await UsersPage.revokeAuthentication();
        await UsersPage.loginAsAdmin();
        await ChangeUsersPasswordPage.load(tempUsers[0].email);
        await ChangeUsersPasswordPage.waitForLoad();
    });

    it("admins can successfully change a user's password", async () => {
        await expectPuppeteer(page).toFill(changeUserPasswordSelectors.passwordInput, 'new password value foobar');
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.saveButton);
        await ChangeUsersPasswordPage.waitForNotification();

        // Check that the password has actually changed for the user, by attempting to login via Florence
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.inputEmail(tempUsers[0].email);

        // Whilst we're here check that an incorrect password still gives the same response
        await LoginPage.inputPassword('foobar');
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        let response;
        try {
            response = await LoginPage.waitForRequestResponse("/zebedee/login");
        } catch (error) {
            console.error("Error waiting for response from login attempt", error);
            fail("Error waiting for response from login attempt");
        }
        expect(response.status()).toBe(401);

        // Now attempt to login with new password
        await LoginPage.inputPassword('new password value foobar');
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        try {
            response = await LoginPage.waitForRequestResponse("/zebedee/login");
        } catch (error) {
            console.error("Error waiting for response from login attempt", error);
            fail("Error waiting for response from login attempt");
        }
        expect(response.status()).toBe(417);

        // Log back in as admin for the rest of the tests
        await UsersPage.loginAsAdmin();

        // Reset the user to default state by deleting and recreating it
        console.log("Successfully changed password, recreating temporary user to original state");
        await Zebedee.deleteUsers([tempUsers[0]]);
        await Zebedee.createUsers([tempUsers[0]]);
    });

    it("cancelling changing password routes to the user's details", async () => {
        const waitForNavigation = page.waitForNavigation();
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.cancelButton);
        await waitForNavigation;
        expect(await ChangeUsersPasswordPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });
});

describe("Publisher trying to delete a user", () => {
    beforeAll(async () => {
        await Page.revokeAuthentication();
        await Page.loginAsPublisher();
    });

    it("redirects them to the user's details screen on direct load of the route", async () => {
        const waitForNavigation = page.waitForNavigation();
        await ChangeUsersPasswordPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        await waitForNavigation;
        await ChangeUsersPasswordPage.waitToBeHidden();
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });

    it("can't attempt to delete a user through the user journey from the users screen", async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(false);
    });
});