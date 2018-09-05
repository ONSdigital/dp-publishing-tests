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
    await Zebedee.createUsers(tempUsers);
});

afterAll(async () => {
    await Zebedee.deleteUsers(tempUsers);
});

describe("Starting from the user's screen", () => {
    beforeAll(async () => {
        await UsersPage.revokeAuthentication();
        await UsersPage.loginAsAdmin();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUsers[0].email);
        await UserDetailsPage.waitForAnimationToEnd();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(true);
        await expectPuppeteer(page).toClick(userDetailsSelectors.deleteUserButton);
        await ConfirmDeleteUserPage.waitForLoad();
    });

    it("admins can successfully delete a user", async () => {       
        await expectPuppeteer(page).toFill(deleteUserSelector.input, tempUsers[0].email);
        const waitForNotification = ConfirmDeleteUserPage.waitForNotification();
        await expectPuppeteer(page).toClick(deleteUserSelector.deleteButton, {text: "Delete"});
        await waitForNotification;

        // Check that the user doesn't exists in the list of all users
        const users = await UsersPage.getAllUserNamesAndIDs();
        const tempUserStillExists = users.some(user => user.id === tempUsers[0].email);
        expect(tempUserStillExists).toBe(false);

        // Recreate the deleted user on Zebedee so that we don't break future tests or the teardown!
        console.log("Recreating user after delete test passed");
        await Zebedee.createUsers(tempUsers);
    });

    it("shows an error message when the email input is left empty", async () => {
        await expectPuppeteer(page).toClick(deleteUserSelector.deleteButton, {text: "Delete"});
        expect(await ConfirmDeleteUserPage.getInlineErrorMessage()).toBe("You must enter the user's email address");
    });

    it("shows an error message when the wrong email is input", async () => {
        await expectPuppeteer(page).toFill(deleteUserSelector.input, "incorrectuser@email.com");
        await expectPuppeteer(page).toClick(deleteUserSelector.deleteButton, {text: "Delete"});
        expect(await ConfirmDeleteUserPage.getInlineErrorMessage()).toBe(`Email address must match '${tempUsers[0].email}'`);
    });

    it("removes error messages once the user starts typing", async () => {
        await expectPuppeteer(page).toClick(deleteUserSelector.deleteButton, {text: "Delete"});
        expect(await ConfirmDeleteUserPage.errorMessageIsVisible()).toBe(true);
        expect(await ConfirmDeleteUserPage.getInlineErrorMessage()).toBe("You must enter the user's email address");

        await expectPuppeteer(page).toFill(deleteUserSelector.input, "a");
        expect(await ConfirmDeleteUserPage.errorMessageIsVisible()).toBe(false);
    });

    it("cancelling the delete routes to the user's details", async () => {
        const waitForNavigation = page.waitForNavigation();
        await expectPuppeteer(page).toClick(deleteUserSelector.cancelButton, {text: "Cancel"});
        await waitForNavigation;
        expect(await ConfirmDeleteUserPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });
});

describe("Loading the 'confirm user delete' route directly", () => {
    beforeAll(async () => {
        await UsersPage.revokeAuthentication();
        await UsersPage.loginAsAdmin();
    });

    beforeEach(async () => {
        await ConfirmDeleteUserPage.load(tempUsers[0].email);
        await ConfirmDeleteUserPage.waitForLoad();
    });

    it("deleting the user is successful", async () => {
        await expectPuppeteer(page).toFill(deleteUserSelector.input, tempUsers[0].email);
        await expectPuppeteer(page).toClick(deleteUserSelector.deleteButton, {text: "Delete"});
        await ConfirmDeleteUserPage.waitForNotification();

        // Check that the user doesn't exists in the list of all users
        const users = await UsersPage.getAllUserNamesAndIDs();
        const tempUserStillExists = users.some(user => user.id === tempUsers[0].email);
        expect(tempUserStillExists).toBe(false);

        // Recreate the deleted user on Zebedee so that we don't break future tests or the teardown!
        console.log("Recreating user after delete test passed");
        await Zebedee.createUsers(tempUsers);
    });

    it("cancelling the delete routes to the user's details", async () => {
        const waitForNavigation = page.waitForNavigation();
        await expectPuppeteer(page).toClick(deleteUserSelector.cancelButton, {text: "Cancel"});
        await waitForNavigation;
        expect(await ConfirmDeleteUserPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });
});

describe("Publisher trying to delete a user", () => {
    beforeAll(async () => {
        await Page.revokeAuthentication();
        await Page.loginAsPublisher();
    });

    it("redirects them to the user's details screen on direct load of the route", async () => {
        const waitForNavigation = page.waitForNavigation();
        await ConfirmDeleteUserPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        await waitForNavigation;
        await ConfirmDeleteUserPage.waitToBeHidden();
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });


    it("can't attempt to delete a user through the user journey from the users screen", async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(false);
    });
});