import Page from "../Page";


export default class CollectionEdit extends Page {

    static async isLoaded() {
        try {
            return await page.$eval('#collection-edit-name', _ => {
                return true;
            });
        } catch (err) {
            return false;
        }
    }

    static async waitForLoad() {
        return page.waitForSelector('#collection-edit-name');
    }

    static async getInputValue(inputId) {
        return await page.$eval(inputId, input => {
            return input.value;
        });
    }

    static async getRadioSelectedValue(radioId) {
        return await page.$eval(radioId, radio => {
            return radio.checked;
        });
    }

    static async collectionNameValidationErrorVisible(className) {
        return await page.$eval(className, validationError => {
            return validationError.textContent === "Collections must be given a name"
        })
    }

    static async scheduleOptionsAreVisibile(scheduleOptionsId) {
        return await page.$eval(scheduleOptionsId, scheduleOptions => {
            if (scheduleOptions) {
                return true
            }
            return false
        })
    }

    static async selectATeam(teamId) {
        await page.select('#collection-edit-teams', teamId.toString())
    }

    static async collectionHasTeams() {
        try {
            return await page.$eval('.selected-item-list__item', _ => {
                return true
            })
        } catch(err) {
            return false
        }
    }
}