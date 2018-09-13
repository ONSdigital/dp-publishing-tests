import expectPuppeteer from 'expect-puppeteer';

import UsersPage from '../../pages/users/UsersPage';
import UserDetails from '../../pages/users/UserDetailsPage';
import Zebedee from '../../../clients/Zebedee';

const createTestUsers = [
    {
        username: "test-created-username1",
        email: "test-created-email1@test.com",
        password: "test-password",
    },
    {
        username: "test-created-username2",
        email: "test-created-email2@test.com",
        password: "test-password",
    }
];

describe("Creating a new user", () => {
    beforeAll(async () => {
        await UsersPage.initialise();
        await UsersPage.revokeAuthentication();
        await UsersPage.loginAsAdmin();
    });

    beforeEach(async () => {
        await UsersPage.load();
        await UsersPage.waitForLoad();
    });

    afterAll(async ()=> {
        Zebedee.deleteUsers(createTestUsers);
    });

    it("creates a new user", async () => {
        await expectPuppeteer(page).toFillForm('form[name="create-new-user"]', {...createTestUsers[0]})
        await expectPuppeteer(page).toClick('button', { text: 'Create user' });
        await page.waitForNavigation();
        await UserDetails.waitForLoad();
        const userDetailsIsLoaded = await UserDetails.isLoaded(createTestUsers[0].username);
        expect(userDetailsIsLoaded).toBe(true);

        // check user has been created by API
        const response = await Zebedee.getUserByID(createTestUsers[0].email).then(response => response.json());
        expect(response.name).toBe(createTestUsers[0].username);
    })

    it("validates username input", async ()=> {
        await expectPuppeteer(page).toClick('button', { text: 'Create user' })
        await expectPuppeteer(page).toMatchElement('div', { text: 'You must enter a username' })
    });
    it("validates email input", async () => {
        await expectPuppeteer(page).toFill('input[name="username"]', createTestUsers[0].username);
        await expectPuppeteer(page).toClick('button', { text: 'Create user' })
        await expectPuppeteer(page).toMatchElement('div', { text: 'You must enter a email' })
    });
    it("validates password input", async () => {
        await expectPuppeteer(page).toFill('input[name="username"]', createTestUsers[0].username);
        await expectPuppeteer(page).toFill('input[name="email"]', createTestUsers[0].email);
        await expectPuppeteer(page).toClick('button', { text: 'Create user' })
        await expectPuppeteer(page).toMatchElement('div', { text: 'You must enter a password' })
    });
    it("can create different user types", async () => {
        await UsersPage.fillCreateUserForm({...createTestUsers[1], type: "admin"})
        await expectPuppeteer(page).toClick('button', { text: 'Create user' });
        await UserDetails.waitForLoad();
        await expectPuppeteer(page).toMatchElement('p', { text: `${createTestUsers[1].username} is an admin` })

        // check user has correct permissions using API
        const userPermissions = await Zebedee.getPermissionsByUserID(createTestUsers[1].email)
        expect(userPermissions.admin).toBe(true);
    })
})

