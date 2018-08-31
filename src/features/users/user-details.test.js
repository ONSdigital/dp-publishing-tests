import expectPuppeteer from 'expect-puppeteer';

import UsersPage from '../../pages/users/UsersPage';
import Page from '../../pages/Page';
import UserDetailsPage, { userDetailsSelectors } from '../../pages/users/UserDetailsPage';
import Zebedee from '../../../clients/Zebedee';
import ChangeUsersPasswordPage from '../../pages/users/ChangeUsersPasswordPage';
import ConfirmDeleteUserPage from '../../pages/users/ConfirmDeleteUserPage';

const tempUsers = [
    {
        name: "acceptancetestuser (admin)",
        email: "acceptancetestuseradmin@test.com",
        type: "admin",
        confirmPassword: true
    },
    {
        name: "acceptancetestuser (publisher)",
        email: "acceptancetestuserpublisher@test.com",
        type: "editor",
        confirmPassword: true
    },
    {
        name: "acceptancetestuser (viewer)",
        email: "acceptancetestuserviewer@test.com",
        type: "viewer",
        confirmPassword: true
    },
    {
        name: "acceptancetestuser (viewer - temp password)",
        email: "acceptancetestuserviewertemppassword@test.com",
        type: "viewer",
        confirmPassword: false
    }
];

beforeAll(async () => {
    await Page.initialise(true);
    await Zebedee.createUsers(tempUsers);
});

afterAll(async ()=> {
    await Zebedee.deleteUsers(tempUsers)
});

describe("Admin users", () => {
    beforeAll(async () => {
        await Page.loginAsAdmin();
    });
    afterAll(async () => {
        await Page.revokeAuthentication();
    });

    beforeEach(async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
    });

    it("can view others users' details", async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        
        await UserDetailsPage.load(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        
        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
    });
    
    it("can view others users' details by selecting them from the list of users", async () => {
        await UserDetailsPage.load(Zebedee.getTempAdminUserEmail());
        await UserDetailsPage.waitForLoad();
        const waitForNavigation = page.waitForNavigation();
        await UsersPage.selectUser(tempUsers[1].email);
        await waitForNavigation;
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[1].email}`);
        await expectPuppeteer(page).toMatchElement(userDetailsSelectors.userName, {text: tempUsers[1].name});
        await expectPuppeteer(page).toMatchElement(userDetailsSelectors.userEmail, {text: tempUsers[1].email});
    });

    it("can view whether a user has a temporary password", async () => {
        await UserDetailsPage.load(tempUsers[3].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(true);
    });
    
    it("isn't shown a message when a user doesn't have a temporary password", async () => {
        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(false);
    });

    it("'change password' action shows for user's own details", async () => {
        await UserDetailsPage.load(Zebedee.getTempAdminUserEmail());
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.userActionsBarIsVisible()).toBe(true);
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(true);
    });

    it("'change password' action shows other user's details", async () => {
        expect(await UserDetailsPage.userActionsBarIsVisible()).toBe(true);
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(true);
    });

    it("'change password' action takes users to the change password screen", async () => {
        await expectPuppeteer(page).toClick(userDetailsSelectors.changePasswordButton);
        await ChangeUsersPasswordPage.waitForLoad();
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}/change-password`);
    });

    it("'delete' action shows for all user's details", async () => {
        expect(await UserDetailsPage.userActionsBarIsVisible()).toBe(true);
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(true);
    });

    it("'delete' action takes user to delete confirmation screen", async () => {
        await expectPuppeteer(page).toClick(userDetailsSelectors.deleteUserButton);
        await ConfirmDeleteUserPage.waitForLoad();
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}/confirm-delete`);
    });

    it("'close' action shows for all user's details", async () => {
        expect(await UserDetailsPage.closeUserButtonIsVisible()).toBe(true);
    });

    it("'close' action takes user to users screen", async () => {
        const waitForNavigation = page.waitForNavigation();
        await expectPuppeteer(page).toClick('.drawer__footer button', {text: "Close"});
        await waitForNavigation;
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users`);
        expect(await UserDetailsPage.isVisible()).toBe(false);
    });
});

describe("Non-admin users", () => {
    beforeAll(async () => {
        await Page.loginAsPublisher();
    });
    afterAll(async () => {
        await Page.revokeAuthentication();
    });

    it("can view others users' details from a direct route", async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.userActionsBarIsVisible()).toBe(false);
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[0].email}`);
    });
    
    it("can view another users' details by selecting them from the list of users", async () => {
        await UserDetailsPage.load(Zebedee.getTempPublisherUserEmail());
        await UserDetailsPage.waitForLoad();
        await expectPuppeteer(page).toMatchElement(userDetailsSelectors.userName, {text: Zebedee.getTempPublisherUserEmail()});
        await expectPuppeteer(page).toMatchElement(userDetailsSelectors.userEmail, {text: Zebedee.getTempPublisherUserEmail()});
        const waitForNavigation = page.waitForNavigation();
        await UsersPage.selectUser(tempUsers[1].email);
        await waitForNavigation;
        expect(await UserDetailsPage.currentPath()).toBe(`/florence/users/${tempUsers[1].email}`);
        await expectPuppeteer(page).toMatchElement(userDetailsSelectors.userName, {text: tempUsers[1].name});
        await expectPuppeteer(page).toMatchElement(userDetailsSelectors.userEmail, {text: tempUsers[1].email});
    });

    it("can view user's name", async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersName()).toBe(tempUsers[0].name);
    });

    it("can view user's email address", async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersEmail()).toBe(tempUsers[0].email);
    });

    it("can view a user's role", async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersRole()).toBe(`${tempUsers[0].name} is an admin`);
        
        await UserDetailsPage.load(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersRole()).toBe(`${tempUsers[1].name} is a publisher`);
        
        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersRole()).toBe(`${tempUsers[2].name} is a viewer`);
    });
    
    it("can view whether a user has a temporary password", async () => {
        await UserDetailsPage.load(tempUsers[3].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(true);
    });
    
    it("isn't shown a message when a user doesn't have a temporary password", async () => {
        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(false);
    });

    it("'change password' action shows on user's own details", async () => {
        await UserDetailsPage.load(Zebedee.getTempPublisherUserEmail());
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(true);
    });

    it("'change password' action isn't available on other user's details", async () => {
        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(false);
    });

    it("banner containing actions doesn't show on other user's details", async () => {
        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.userActionsBarIsVisible()).toBe(false);
    });

    it("'delete' action doesn't show on any user's details", async () => {
        await UserDetailsPage.load(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(false);
    });

    it("'close' action doesn't show on any user's details", async () => {
        await UserDetailsPage.load(tempUsers[0].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.closeUserButtonIsVisible()).toBe(false);
    });

    it("footer showing actions doesn't show on any users' details", async () => {
        await UserDetailsPage.load(Zebedee.getTempPublisherUserEmail());
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.userActionsFooterIsVisible()).toBe(false);

        await UserDetailsPage.load(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.userActionsFooterIsVisible()).toBe(false);
        const waitForNavigation = page.waitForNavigation();
        await UsersPage.selectUser(tempUsers[1].email);
        await waitForNavigation;
        expect(await UserDetailsPage.userActionsFooterIsVisible()).toBe(false);
    });
});

describe("Admin users selecting a user", () => {
    beforeAll(async () => {
        await Page.initialise();
    });
    afterAll(async () => {
        await Page.revokeAuthentication();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
    });

    it("displays the user's name", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersName()).toBe(tempUsers[1].name);
    });

    it("displays the user's email", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersEmail()).toBe(tempUsers[1].email);
    });

    it("displays the user's role", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        await UserDetailsPage.screenshot();
        expect(await UserDetailsPage.getUsersRole()).toBe(`${tempUsers[1].name} is a publisher`);
    });

    it("displays when a user has a temporary password", async () => {
        await UsersPage.selectUser(tempUsers[3].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(true);
    });
    
    it("doesn't display a message when a user doesn't have a temporary password", async () => {
        await UsersPage.selectUser(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(false);
    });
    
    it("displays the 'change password' action", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(true);
    });
    
    it("displays the 'delete' action", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(true);
    });
    
    it("displays the 'close' action", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.closeUserButtonIsVisible()).toBe(true);
    });
});

describe("Non-admins users selecting a user", () => {
    beforeAll(async () => {
        await Page.loginAsPublisher();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
    });

    it("displays the user's name", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersName()).toBe(tempUsers[1].name);
    });

    it("displays the user's email", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersEmail()).toBe(tempUsers[1].email);
    });

    it("displays the user's role", async () => {
        await UsersPage.selectUser(tempUsers[1].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.getUsersRole()).toBe(`${tempUsers[1].name} is a publisher`);
    });

    it("displays when a user has a temporary password", async () => {
        await UsersPage.selectUser(tempUsers[3].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(true);
    });
    
    it("doesn't display a message when a user doesn't have a temporary password", async () => {
        await UsersPage.selectUser(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.tempPasswordTextIsVisible()).toBe(false);
    });

    it("displays the 'change password' button if it's their own account", async () => {
        await UsersPage.selectUser(Zebedee.getTempPublisherUserEmail());
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(true);
    });

    it("doesn't display the 'change password' button if it's another user's account", async () => {
        await UsersPage.selectUser(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.changePasswordButtonIsVisible()).toBe(false);
    });

    it("doesn't display the 'close' action", async () => {
        await UsersPage.selectUser(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.closeUserButtonIsVisible()).toBe(false);
    });

    it("doesn't display the 'delete' action", async () => {
        await UsersPage.selectUser(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(false);
    });

    it("doesn't display the actions footer", async () => {
        await UsersPage.selectUser(tempUsers[2].email);
        await UserDetailsPage.waitForLoad();
        expect(await UserDetailsPage.userActionsFooterIsVisible()).toBe(false);
    });
});