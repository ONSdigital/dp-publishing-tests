import CollectionsPage, { collectionsPageSelectors } from '../../pages/collections/CollectionsPage';
import CollectionDetails from '../../pages/collections/CollectionDetails';
import CollectionEdit from '../../pages/collections/CollectionEdit';
import Zebedee from '../../../clients/Zebedee'

const tempCollectionData = [
    {
        name: "Acceptance test collection for edit collection test",
        publishDate: null,
        releaseUri: null,
        teams: [],
        type: "manual",
        collectionOwner: "ADMIN"
    },
];

const tempTeams = [
    {name: "AccTest Team 1"},
    {name: "AccTest Team 2"}
]

let testCollection = []

beforeAll(async () => {
    await CollectionsPage.initialise();
});

describe("Editing a collection", () => {

    beforeAll(async () => {
        console.log("Automatically creating test collection");
        await CollectionsPage.revokeAuthentication();
        await CollectionsPage.loginAsAdmin();
        testCollection = await CollectionsPage.setupCollectionsList(tempCollectionData);
        await Zebedee.createTeam(tempTeams[0].name);
        await Zebedee.createTeam(tempTeams[1].name);
    });

    afterAll(async () => {
        await Zebedee.deleteTeam(tempTeams[0].name);
        await Zebedee.deleteTeam(tempTeams[1].name);
        await CollectionsPage.cleanupCreatedCollections();
    });

    beforeEach(async () => {
        await CollectionsPage.load();
        await CollectionsPage.waitForLoad();
    });

    it(`/edit displays the edit pane`, async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        const isLoaded = await CollectionEdit.isLoaded();
        expect(isLoaded).toBeTruthy();
    })

    it('clicking cancel button removes edit pane', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await expect(page).toClick('button', {text: "Cancel"});
        const isLoaded = await CollectionEdit.isLoaded();
        expect(isLoaded).toBeFalsy();
    })

    it('the correct values are displayed when first displaying edit pane', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        const editName = await CollectionEdit.getInputValue("#collection-edit-name");
        expect(editName).toBe("Acceptance test collection for edit collection test")
        const editTeams = await CollectionEdit.getInputValue("#collection-edit-teams");
        expect(editTeams).toBe("default-option");
        const scheduledPublish = await CollectionEdit.getRadioSelectedValue("#edit-type-schedule");
        expect(scheduledPublish).toBeFalsy();
        const manualPublish = await CollectionEdit.getRadioSelectedValue("#edit-type-manual");
        expect(manualPublish).toBeTruthy();
    })

    it('changes to collection name field show', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        expect(await CollectionEdit.getInputValue("#collection-edit-name")).toBe("Acceptance test collection for edit collection test")
        await expect(page).toFill('input[name="collection-edit-name"]', "New name")
        expect(await CollectionEdit.getInputValue("#collection-edit-name")).toBe("New name")
    })

    it('displays empty field validation errors', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        await expect(page).toFill('input[name="collection-edit-name"]', " ")
        await expect(page).toClick('button.btn--positive', {text: "Save and return"});
        const validationMessageVisible = await CollectionEdit.collectionNameValidationErrorVisible('.error-msg');
        expect(validationMessageVisible).toBeTruthy();
    })

    it('can add and remove a team from a collection', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        expect(await CollectionEdit.collectionHasTeams()).toBeFalsy();
        const teamId = await Zebedee.getTeamId(tempTeams[1].name);
        await CollectionEdit.selectATeam(teamId)
        expect(await CollectionEdit.collectionHasTeams()).toBeTruthy();
        await expect(page).toClick('button.selected-item-list__remove', {text: "×"});
        expect(await CollectionEdit.collectionHasTeams()).toBeFalsy();
    })

    it('clicking schedule radio option triggers schedule options to show', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        await expect(page).toClick('#edit-type-schedule');
        const scheduleOptionsIsVisible = await CollectionEdit.scheduleOptionsAreVisibile('#edit-publish-date')
        expect(scheduleOptionsIsVisible).toBeTruthy();
    })

    it('saves changes to collection name and schedule date', async () => {
        await CollectionEdit.goto(`/collections/${testCollection[0].id}/edit`);
        await CollectionEdit.waitForLoad();
        expect(await CollectionEdit.getInputValue("#collection-edit-name")).toBe("Acceptance test collection for edit collection test")
        await expect(page).toFill('input[name="collection-edit-name"]', "New name")
        expect(await CollectionEdit.getInputValue("#collection-edit-name")).toBe("New name")
        await expect(page).toClick('#edit-type-schedule');
        await expect(page).toFill('input[name="edit-publish-date"]', "28/06/2018")
        await expect(page).toClick('button.btn--positive', {text: "Save and return"});
        await CollectionDetails.waitForLoad();
        const collectionHeadingDetails = await CollectionDetails.getHeadingData();
        expect(collectionHeadingDetails.name).toBe("New name");
        expect(collectionHeadingDetails.publishDate).toBe("Publish date: Thursday, 28 June 2018 9:30AM");
        // get the collection details from Zebedee to check changes were saved to disk
        const zebedeeCollectionDetails = await Zebedee.getCollectionDetails(testCollection[0].id)
        expect(zebedeeCollectionDetails.name).toBe("New name");
        expect(zebedeeCollectionDetails.publishDate).toBe("2018-06-28T08:30:00.000Z")
    })

})