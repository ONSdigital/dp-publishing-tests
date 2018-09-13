import expectPuppeteer from 'expect-puppeteer';
import { format, addMinutes, differenceInMilliseconds } from 'date-fns';

import CollectionsPage from '../../pages/collections/CollectionsPage';
import CollectionDetails, { collectionDetailsSelectors } from '../../pages/collections/CollectionDetails';
import BrowsePages, { browsePagesSelector } from '../../pages/workspace/BrowsePages';
import CreatePage, { createPageSelectors } from '../../pages/workspace/CreatePage';
import EditPage, { editPageSelectors } from '../../pages/workspace/EditPage';
import Zebedee from '../../../clients/Zebedee';
import Page from '../../pages/Page';
import LoginPage, { loginPageSelectors } from '../../pages/login/LoginPage';
import PublishQueuePage, { publishQueueSelectors } from '../../pages/publish-queue/PublishQueuePage';
import WebPage from '../../pages/WebPage';
import WorkspacePage from '../../pages/workspace/WorkspacePage';
import UsersPage from '../../pages/users/UsersPage';
import UserDetailsPage, { userDetailsSelectors } from '../../pages/users/UserDetailsPage';
import ChangeUsersPasswordPage, { changeUserPasswordSelectors } from '../../pages/users/ChangeUsersPasswordPage';
import ConfirmDeleteUserPage, { deleteUserSelector } from '../../pages/users/ConfirmDeleteUserPage';

beforeAll(async () => {
    await Page.initialise();
});

afterAll(async () => {
    await CollectionsPage.cleanupCreatedCollections();
});

const publishNewPage = async publishType => {
    const uniqueID = Math.floor(Math.random() * 1000000000);
    const pageName = `Acceptance test - end-to-end manual static landing page publish (${uniqueID})`;
    const formData = {
        name: `Acceptance test - end-to-end ${publishType} publish (${uniqueID})`,
        releaseType: publishType
    };
    let publishDate;

    if (publishType === "scheduled") {
        const currentDate = new Date();
        const todaysDate = format(currentDate, "DD-MM-YYYY");
        publishDate = addMinutes(currentDate, currentDate.getSeconds() < 30 ? 1 : 2); //give ourselves an extra minute to publish if we're already halfway through the current minute
        formData.scheduledBy = "date",
        formData.publishDate = todaysDate,
        formData.publishTime = `${format(publishDate, "HH:mm")}`;
    }

    await CollectionsPage.fillCreateCollectionForm(formData);

    const newCollection = await CollectionsPage.submitCreateCollectionForm();
    CollectionsPage.addCreatedCollectionID(newCollection.id);
    
    await CollectionDetails.waitForLoad();
    await expectPuppeteer(page).toClick(collectionDetailsSelectors.createEditPageButton);
    
    await BrowsePages.waitForLoad();

    // We have to check that the preview's content window has updated it's location.href value.
    // if it hasn't updated yet then the create page screen can break because Florence checks the location
    // that a page is being created under, but will get an old page and state that the bulletin
    // cannot be created there.
    await BrowsePages.waitForPreviewToLoadURL("/").catch(error => {
        console.error("Error waiting for the preview pane to load", error);
        throw error;
    });

    const selectedPage = await BrowsePages.getSelectedPageElement();
    await expectPuppeteer(selectedPage).toClick(browsePagesSelector.createButton);
    
    await CreatePage.waitForLoad();
    await page.select(createPageSelectors.pageTypeSelect, 'static_landing_page');

    await CreatePage.fillCreatePageForm({
        name: pageName
    });

    await expectPuppeteer(page).toClick(createPageSelectors.submitButton);

    // Check that an error message isn't showing, this is because sometime we'll
    // get errors if the same page exists
    expect(await Page.hasGlobalErrorMsg()).toBe(false);

    await Promise.all([
        EditPage.waitForLoad(),
        WorkspacePage.waitForPreviewToLoad()
    ]);
    const pagePath = await WorkspacePage.getAddressBarPath();
    await expectPuppeteer(page).toClick(editPageSelectors.submitForReviewButton);
    
    await CollectionDetails.waitForLoad();

    // Simulates logging in as another user, so that we can review the page we just submitted for review
    await Page.setAccessTokenCookie(Zebedee.getAdminAccessToken());
    await Page.setSessionEmailLocalStorage(Zebedee.getAdminUserEmail());

    await expectPuppeteer(page).toClick(collectionDetailsSelectors.pageItem, {text: pageName});
    await expectPuppeteer(page).toClick(collectionDetailsSelectors.pageActionButton, {text: "Review"});

    await EditPage.waitForLoad();
    await expectPuppeteer(page).toClick(editPageSelectors.submitForApprovalButton);

    await CollectionDetails.waitForLoad();
    const collectionID = await CollectionDetails.getActiveCollectionID();
    await expectPuppeteer(page).toClick(collectionDetailsSelectors.approveCollection, {text: "Approve"});
    await CollectionsPage.waitForCollectionToDisappear(collectionID);

    if (publishType === "manual") {
        await expectPuppeteer(page).toClick('.global-nav__list a', {text: 'Publishing queue'});
        await PublishQueuePage.waitForLoad();
        await expectPuppeteer(page).toClick('td', {text: '[manual collection]'});
        
        // NOTE: we're having to wait for the animation to finish with a simple timer.
        // Sadly we can't be smarter and wait for a selector because the animation is done 
        // without any class/selector changes to wait for.
        // It instead it uses JS to amend the style attribute directly on the element :'(
        await page.waitFor(1000);
    
        // We have to get the element itself and click it, rather than simply using a selector
        // because the only unique element we can get from the DOM has event propagation disabled
        // on it, so the click event doesn't bubble up to the necessary element that handles it.
        const collectionTitle = await PublishQueuePage.collectionAccordionTitleElement(collectionID);
        await expectPuppeteer(collectionTitle).toClick('*');
    
        // There's an animation on the accordion that we can't wait for a selector on (similar to the comment above)
        // so we just have to pause until the animation is finished
        await page.waitFor(1000);
        
        await expectPuppeteer(page).toClick(publishQueueSelectors.collectionAction, {text: "Publish collection"});
    
    
        const hasPublished = await PublishQueuePage.collectionHasPublished(collectionID);
        expect(hasPublished).toBe(true);
    }
    
    return {
        path: pagePath,
        name: pageName,
        publishDate
    };
}

const checkPageIsLive = async (path, name, publishDate) => {
    if (publishDate) {
        const msTillPublish = differenceInMilliseconds(new Date(publishDate), new Date());
        await page.waitFor(msTillPublish);
    }

    const waitForNavigation = page.waitForNavigation({waitUntil: "networkidle0"});
    await WebPage.goto(path);
    await waitForNavigation;
    await expectPuppeteer(page).toMatchElement('h1', {text: name});
    await Zebedee.deletePublishedPage(path);
};

const getPageHeadingByURL = async (path, publishDate) => {
    if (publishDate) {
        const msTillPublish = differenceInMilliseconds(new Date(publishDate), new Date());
        await page.waitFor(msTillPublish);
    }

    const waitForNavigation = page.waitForNavigation({waitUntil: "networkidle0"});
    await WebPage.goto(path);
    await waitForNavigation;
    const pageHeading = await page.$eval('h1', heading => heading.textContent);
    await Zebedee.deletePublishedPage(path);
    return pageHeading;
};
describe("Publishing end-to-end", () => {

    beforeEach(async () => {
        await Page.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
    });

    it("a manual collection (publisher)", async () => {
        await LoginPage.inputEmail(Zebedee.getTempPublisherUserEmail());
        await LoginPage.inputPassword(Zebedee.getTempAccountsPassword());
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("manual");
        await checkPageIsLive(newPage.path, newPage.name);
    }, 60000);

      
    it("a manual collection (admin)", async () => {
        await LoginPage.inputEmail(Zebedee.getTempAdminUserEmail());
        await LoginPage.inputPassword(Zebedee.getTempAccountsPassword());
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("manual");
        await checkPageIsLive(newPage.path, newPage.name);
    }, 60000);
    
    it("a scheduled collection (publisher)", async () => {
        await LoginPage.inputEmail(Zebedee.getTempPublisherUserEmail());
        await LoginPage.inputPassword(Zebedee.getTempAccountsPassword());
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("scheduled");
        await checkPageIsLive(newPage.path, newPage.name, newPage.publishDate);
    }, 240000);

    it("a scheduled collection (admin)", async () => {
        await LoginPage.inputEmail(Zebedee.getTempAdminUserEmail());
        await LoginPage.inputPassword(Zebedee.getTempAccountsPassword());
        await expectPuppeteer(page).toClick(loginPageSelectors.loginButton);
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("scheduled");
        await checkPageIsLive(newPage.path, newPage.name, newPage.publishDate);
    }, 240000);
});

const tempUser = {
    username: "test-created-username1",
    email: "test-created-email1@test.com",
    password: "test-password"
}

describe("Creating users", () => {

    beforeEach(async () => {
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
    })

    afterEach(async () => {
        await Zebedee.deleteUsers([tempUser]);
    });

    afterAll(async () => {
        await LoginPage.revokeAuthentication();
    })

    it("new admin user can login, create and publish collection [scheduled]", async () => {
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword())
        await CollectionsPage.waitForLoad();

        // create user 
        await Page.goto("/users");
        await UsersPage.waitForLoad();
        await UsersPage.createUser(tempUser, "admin");

        // log out and try sign in as new admin and set new password
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.login(tempUser.email, tempUser.password)
        await LoginPage.updateTemporaryPassword("a new password value");
        
        // create and publish new page
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("scheduled");
        const pageName = await getPageHeadingByURL(newPage.path, newPage.publishDate);
        expect(pageName).toBe(newPage.name);
    }, 240000);

    it("new admin user can login, create and publish collection [manual]", async () => {
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword())
        await CollectionsPage.waitForLoad();

        // create user 
        await Page.goto("/users");
        await UsersPage.waitForLoad();
        await UsersPage.createUser(tempUser, "admin");

        // log out and try sign in as new admin and set new password
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.login(tempUser.email, tempUser.password)
        await LoginPage.updateTemporaryPassword("a new password value");
        
        // create and publish new page
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("manual");
        const pageName = await getPageHeadingByURL(newPage.path, newPage.publishDate);
        expect(pageName).toBe(newPage.name);
    }, 240000);

    it("new publishing user can login, create and publish collection [manual]", async () => {
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword())
        await CollectionsPage.waitForLoad();

        // create user 
        await Page.goto("/users");
        await UsersPage.waitForLoad();
        await UsersPage.createUser(tempUser, "publisher");

        // log out and try sign in as new admin and set new password
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.login(tempUser.email, tempUser.password)
        await LoginPage.updateTemporaryPassword("a new password value");
        
        // create and publish new page
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("manual");
        const pageName = await getPageHeadingByURL(newPage.path, newPage.publishDate);
        expect(pageName).toBe(newPage.name);
    }, 240000);

    it("new admin user can login, create and publish collection [manual]", async () => {
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword())
        await CollectionsPage.waitForLoad();

        // create user 
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.createUser(tempUser, "publisher");

        // log out and try sign in as new admin and set new password
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
        await LoginPage.login(tempUser.email, tempUser.password)
        await LoginPage.updateTemporaryPassword("a new password value");
        
        // create and publish new page
        await CollectionsPage.waitForLoad();
        const newPage = await publishNewPage("manual");
        const pageName = await getPageHeadingByURL(newPage.path, newPage.publishDate);
        expect(pageName).toBe(newPage.name);
    }, 240000);
});

describe("Resetting a user's password", () => {
    const tempUsers = [{
        name: "acceptancetestuser for resetting password (publisher)",
        email: "acceptancetestresetpasswordpublisher@test.com",
        type: "editor",
        confirmPassword: true
    }];
    let createdCollectionID;

    beforeAll(async () => {
        await Zebedee.createUsers(tempUsers);
        const createdCollection = await Zebedee.createCollection({
            name: "Acceptance test collection for reset user password collection check",
            publishDate: null,
            releaseUri: null,
            teams: [],
            type: "manual",
            collectionOwner: "ADMIN"
        });
        createdCollectionID = createdCollection.id;
    });

    afterAll(async () => {
        await Zebedee.deleteCollection(createdCollectionID);
        await Zebedee.deleteUsers(tempUsers);
    });

    beforeEach(async () => {
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
    });

    it("admin resetting a publisher's password", async () => {
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword());
        await CollectionsPage.waitForLoad();

        // Reset the publisher's password
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUsers[0].email);
        await UserDetailsPage.waitForAnimationToEnd(tempUsers[0].email);
        expect(await UserDetailsPage.getUsersName()).toBe(tempUsers[0].name);
        await expectPuppeteer(page).toClick(userDetailsSelectors.changePasswordButton);
        await ChangeUsersPasswordPage.waitForLoad();
        await expectPuppeteer(page).toFill(changeUserPasswordSelectors.passwordInput, "one two three four");
        await expectPuppeteer(page).toClick(changeUserPasswordSelectors.saveButton);
        await UserDetailsPage.waitForNotification();
        
        // Log out and try to sign in as the publisher with a new password
        await LoginPage.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.login(tempUsers[0].email, "one two three four");
        await LoginPage.updateTemporaryPassword(Zebedee.getTempAccountsPassword());

        // Validate that the publisher can view the collections
        await CollectionsPage.waitForLoad();
        await expectPuppeteer(page).toClick(`#${createdCollectionID}`);
        await CollectionDetails.waitForLoad();
        const heading = await CollectionDetails.getHeadingData();
        expect(heading.name).toBe("Acceptance test collection for reset user password collection check");
    });
});

describe("Deleting users", () => {
    
    afterAll(async () => {
        const userResponse = await Zebedee.getUserByID(tempUser.email);
        if (userResponse.status !== 404) {
            await Zebedee.deleteUsers([tempUser]);
        }
    });

    beforeEach(async () => {
        await Page.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.waitForLoad();
    });

    it("deleted user can no longer login and make API calls", async () => {
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword());
        await CollectionsPage.waitForLoad();

        // Create publisher user 
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.createUser(tempUser, "publisher");

        // Login as the publisher and check that we can make API calls and get 2XX responses
        await Page.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.login(tempUser.email, tempUser.password);
        await LoginPage.updateTemporaryPassword(Zebedee.getTempAccountsPassword());
        await CollectionsPage.waitForLoad();
        let APICallStatus = await CollectionsPage.requestStatus("/zebedee/collections");
        expect(APICallStatus).toBe(200);

        // Login as the admin user and delete the new publisher
        await Page.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.login(Zebedee.getTempAdminUserEmail(), Zebedee.getTempAccountsPassword());
        await CollectionsPage.waitForLoad();
        await UsersPage.load();
        await UsersPage.waitForLoad();
        await UsersPage.selectUser(tempUser.email);
        await UserDetailsPage.waitForAnimationToEnd();
        expect(await UserDetailsPage.deleteUserButtonIsVisible()).toBe(true);
        await expectPuppeteer(page).toClick(userDetailsSelectors.deleteUserButton);
        await ConfirmDeleteUserPage.waitForLoad();
        await expectPuppeteer(page).toFill(deleteUserSelector.input, tempUser.email);
        await expectPuppeteer(page).toClick(deleteUserSelector.deleteButton);
        await ConfirmDeleteUserPage.waitForNotification();

        // Fail to login as the previous publisher
        await Page.revokeAuthentication();
        await LoginPage.load();
        await LoginPage.login(tempUser.email, tempUser.password);
        expect(await LoginPage.emailInputHasAnError()).toBe(true);
        expect(await LoginPage.getEmailInputError()).toBe("Email address not recognised");
        
        // Fail to make an API call due to receiving a 2XX response
        APICallStatus = await CollectionsPage.requestStatus("/zebedee/collections");
        expect(APICallStatus).toBe(401);
    });
});