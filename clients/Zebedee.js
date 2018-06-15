const fetch = require('node-fetch');
const interval = require('interval-promise');
const Log = require('../src/utilities/Log');

const path = process.env.PUBLISHING_ENV_URL;
const zebedeeURL = `${path}/zebedee`;
const adminCredentials = {
    email: process.env.ROOT_ADMIN_EMAIL,
    password: process.env.ROOT_ADMIN_PASSWORD
};
const tempAdminUserEmail = "automated-admin@email.com";
const tempAdminUserPassword = process.env.TEMP_USER_PASSWORD;

let accessTokens = {
    tempUser: global.accessTokens ? global.accessTokens.tempUser : "",
    rootAdmin: global.accessTokens ? global.accessTokens.rootAdmin : "",
};

const Zebedee = class {

    static async initialise() {
        Log.info("Zebedee initialisation started");

        if (!adminCredentials.email || !adminCredentials.password) {
            Log.warn("Unable to setup and start tests because root admin email or password not provided\nSet environment variables ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD with valid credentials");
            throw Error("Root admin credentials not provided");
        }

        if (!tempAdminUserPassword) {
            Log.warn("Unable to setup and start tests because no password for the temporary admin account was provided\nSet environment variable TEMP_USER_PASSWORD with a valid password");
            throw Error("Temproary admin account's password not provided");
        }

        const adminAccessToken = await this.loginAsRootAdmin();
        await this.createTempAdminUser(adminAccessToken);

        Log.info("Zebedee initialisation finished");
    }

    static setTempUserAccessToken(token) {
        accessTokens = {...accessTokens, tempUser: token};
    }

    static getTempUserAccessToken() {
        return accessTokens.tempUser;
    }
    
    static setAdminAccessToken(token) {
        accessTokens = {...accessTokens, rootAdmin: token};
    }
    
    static getAdminAccessToken() {
        return accessTokens.rootAdmin;
    }

    static getTempAdminUserEmail() {
        return tempAdminUserEmail;
    }

    static async createTempAdminUser(adminAccessToken) {
        let tempUserAlreadyExists = false;
        const tempPassword = "to be changed";
        const createUserProfileBody = {
            email: tempAdminUserEmail,
            name: tempAdminUserEmail
        };
        const setUserTempPasswordBody = {
            email: tempAdminUserEmail,
            password: tempPassword
        };
        const setUserPermissionsBody = {
           editor: true,
           admin: true,
           email: tempAdminUserEmail 
        };

        await fetch(`${zebedeeURL}/users`, {
            method: "POST",
            body: JSON.stringify(createUserProfileBody),
            headers: {
                "X-Florence-Token": adminAccessToken
            }
        }).then(response => {
            if (!response.ok && response.status !== 409) {
                throw Error(`${response.status} - ${response.statusText}\nFailed to create temporary admin user's profile`);
            }
            if (response.status == 409) {
                // Log.warn("Temporary admin user already exists")
                tempUserAlreadyExists = true;
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });

        if (tempUserAlreadyExists) {
            // Log.warn("Deleting existing temporary admin user");
            await fetch(`${zebedeeURL}/users?email=${tempAdminUserEmail}`, {
                method: "DELETE",
                headers: {
                    "X-Florence-Token": adminAccessToken
                }
            }).then(response => {
                if (!response.ok) {
                    throw Error(`${response.status} - ${response.statusText}\nFailed to delete existing temporary admin user's profile`);
                }
                return response.json();
            }).catch(error => {
                Log.error(error);
            });

            await fetch(`${zebedeeURL}/users`, {
                method: "POST",
                body: JSON.stringify(createUserProfileBody),
                headers: {
                    "X-Florence-Token": adminAccessToken
                }
            }).then(response => {
                if (!response.ok) {
                    throw Error(`${response.status} - ${response.statusText}\nFailed to create temporary admin user's profile`);
                }
                return response.json();
            }).catch(error => {
                Log.error(error);
            });
        }

        await fetch(`${zebedeeURL}/password`, {
            method: "POST",
            body: JSON.stringify(setUserTempPasswordBody),
            headers: {
                "X-Florence-Token": adminAccessToken
            }
        }).then(response => {
            if (!response.ok) {
                throw Error(`${response.status} - ${response.statusText}\nFailed to set temporary for temporary admin user's`);
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });
        
        await fetch(`${zebedeeURL}/permission`, {
            method: "POST",
            body: JSON.stringify(setUserPermissionsBody),
            headers: {
                "X-Florence-Token": adminAccessToken
            }
        }).then(response => {
            if (!response.ok) {
                throw Error(`${response.status} - ${response.statusText}\nFailed to set temporary admin user's permissions`);
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });

        await fetch(`${zebedeeURL}/password`, {
            method: "POST",
            body: JSON.stringify({
                email: tempAdminUserEmail,
                oldPassword: tempPassword,
                password: tempAdminUserPassword
            })
        }).then(response => {
            if (!response.ok && response.status !== 417) {
                throw Error(`${response.status} - ${response.statusText}\nFailed to set temporary admin user's permanent password`);
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });

        const accessToken = await fetch(`${zebedeeURL}/login`, {
            method: "POST",
            body: JSON.stringify({
                email: tempAdminUserEmail,
                password: tempAdminUserPassword
            })
        }).then(response => {
            if (!response.ok) {
                throw Error(`${response.status} - ${response.statusText}\nFailed to login into new temporary admin user's account`);
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });
        
        this.setTempUserAccessToken(accessToken);

        return accessToken;
    }

    static async removeTempAdminUser(adminAccessToken) {
        await fetch(`${zebedeeURL}/users?email=${tempAdminUserEmail}`, {
            method: "DELETE",
            headers: {
                "X-Florence-Token": adminAccessToken
            }
        }).then(response => {
            if (!response.ok) {
                throw Error(`${response.status} - ${response.statusText}\nFailed to delete existing temporary admin user's profile`);
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });
    }

    static async loginAsRootAdmin() {
        const body = JSON.stringify({
            email: adminCredentials.email,
            password: adminCredentials.password
        });
        const config = {
            method: "POST",
            body
        };

        const accessToken = await fetch(`${zebedeeURL}/login`, config)
            .then(response => {
                if (!response.ok) {
                    throw Error(`${response.status} - ${response.statusText}`);
                }
                return response.json();
            }).catch(error => {
                Log.error(error);
                throw Error("Logging into Zebedee as root admin user failed");
            });

        this.setAdminAccessToken(accessToken);

        return accessToken;
    }

    static async cleanup() {
        const accessToken = await this.loginAsRootAdmin();
        await this.removeTempAdminUser(accessToken);
        Log.success("Finished cleaning up environment");
    }

    static async createCollection(collection) {
        const request = accessToken => (
            fetch(`${zebedeeURL}/collection`, {
                body: JSON.stringify(collection),
                headers: {
                    "X-Florence-Token": accessToken,
                    "Content-type": "application/json"
                },
                method: "POST"
            }).catch(error => {
                throw error;
            })
        );

        console.log(`Creating collection '${collection.name}'`);

        let response = await request(this.getAdminAccessToken());
        if (response.status === 409) {
            const json = await response.json();
            if (json.message && json.message === "Cannot use this release. It is being edited as part of another collection.") {
                console.warn(`Unable to create collection '${collection.name}' because release '${collection.releaseUri}' is already in collection '${json.data.collectionName}'`);
                throw Error(`409: ${json.message}`);
            }
            console.warn(`Deleting collection '${collection.name}' because it already exists`);
            const collectionData = await this.getCollectionByName(collection.name);
            await this.deleteCollection(collectionData.id);
            response = await request(this.getAdminAccessToken());
            if (response.status === 409) {
                Log.error("Unable to delete conflicting collection");
                throw Error(`409: ${response.statusText}`);
            }
        }

        if (response.status === 401) {
            // console.log("Not logged in when attempting to create collection. Logging in as admin and trying again.")
            this.setAdminAccessToken(await this.loginAsRootAdmin());
            response = await request(this.getAdminAccessToken());
            if (response.status === 401) {
                Log.error("Login unsuccessful, so unable to create collections");
                throw Error(`401: ${response.statusText}`);
            }
        }

        if (!response.ok) {
            throw Error(`${response.status}: ${response.statusText}, collection '${collection.name}'`);
        }

        const json = await response.json();

        return json;
    }

    static async getCollectionByName(collectionName) {
        const response = await fetch(`${zebedeeURL}/collections`, {
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken(),
                "Content-type": "application/json"
            },
        }).catch(error => {
            Log.error(error);
            throw error;
        });

        if (!response.ok) {
            throw Error("Unable to get all collections from Zebedee");
        }

        const json = await response.json();

        console.log(`Getting data for collection '${collectionName}'`);
        const collection = json.find(collection => collection.name === collectionName);
        if (!collection) {
            throw Error(`Unable to find collection with the name '${collectionName}'`)
        }
        console.log(`Data received for '${collectionName}', new ID: ${collection.id}`);
        return collection;
    }

    static async checkCollectionExists(ID) {
        const response = await fetch(`${zebedeeURL}/collectionDetails/${ID}`, {
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken(),
                "Content-type": "application/json"
            },
            method: "GET"
        });

        if (response.status === 404) {
            return false;
        }

        if (response.ok) {
            return true;
        }

        throw Error(`Unexpected response when checking whether collection '${ID}' exists: ${response.status} - ${response.statusText}`);
    }

    static async getCollectionDetails(ID) {
        const response = await fetch(`${zebedeeURL}/collectionDetails/${ID}`, {
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken(),
                "Content-type": "application/json"
            },
            method: "GET"
        });

        if (!response.ok) {
            throw Error(`Error getting collections details for '${ID}' - ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    static async removePageFromCollection(ID, pageURI) {
        const response = await fetch(`${zebedeeURL}/content/${ID}?uri=${pageURI}`, {
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken()
            },
            method: "DELETE"
        });

        if (!response.ok) {
            throw Error(`Error removing page ${pageURI} from collection '${ID}' - ${response.status}: ${response.statusText}`);
        }
    }

    static async removeAllPagesFromCollection(ID) {
        const collection = await this.getCollectionDetails(ID);
        let pageURIs = [];

        if (collection.inProgress.length > 0) {
            collection.inProgress.forEach(page => {
                pageURIs.push(page.uri);
            })
        }
        
        if (collection.complete.length > 0) {
            collection.complete.forEach(page => {
                pageURIs.push(page.uri);
            })
        }
        
        if (collection.reviewed.length > 0) {
            collection.reviewed.forEach(page => {
                pageURIs.push(page.uri);
            })
        }

        await Promise.all(pageURIs.map(pageURI => (
            this.removePageFromCollection(ID, pageURI)
        )));
    }
    
    static async deleteCollection(ID) {
        console.log(`Deleting collection '${ID}'`);

        if (!(await this.checkCollectionExists(ID))) {
            console.log(`Cancelling delete because collection '${ID}' doesn't exist`);
            return;
        }

        await this.removeAllPagesFromCollection(ID);

        const request = accessToken => (
            fetch(`${zebedeeURL}/collection/${ID}`, {
                headers: {
                    "X-Florence-Token": accessToken
                },
                method: "DELETE"
            }).catch(error => {
                throw error;
            })
        );

        let response = await request(this.getAdminAccessToken());
        if (response.status === 401) {
            Log.info("Not logged in when attempting to delete collection. Logging in as admin and trying again.")
            this.setAdminAccessToken(await this.loginAsRootAdmin());
            response = await request(this.getAdminAccessToken());
            if (response.status === 401) {
                Log.error("Login unsuccessful, so unable to delete collections");
                throw Error(`401: ${response.statusText}`);
            }
        }
        if (!response.ok) {
            throw Error(`${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        return json;
    }

    static async approveCollection(ID) {
        const request = accessToken => (
            fetch(`${zebedeeURL}/approve/${ID}`, {
                headers: {
                    "X-Florence-Token": accessToken
                },
                body: '{}',
                method: "POST"
            }).catch(error => {
                throw error;
            })
        );

        let response = await request(this.getAdminAccessToken());
        if (response.status === 401) {
            // Log.info("Not logged in when attempting to delete collection. Logging in as admin and trying again.")
            this.setAdminAccessToken(await this.loginAsRootAdmin());
            response = await request(this.getAdminAccessToken());
            if (response.status === 401) {
                Log.error("Login unsuccessful, so unable to approve collection");
                throw Error(`401: ${response.statusText}`);
            }
        }
        if (!response.ok) {
            throw Error(`${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        return json;
    }
    
    static async publishCollection(ID) {
        const request = accessToken => (
            fetch(`${zebedeeURL}/publish/${ID}`, {
                headers: {
                    "X-Florence-Token": accessToken
                },
                body: '{}',
                method: "POST"
            }).catch(error => {
                throw error;
            })
        );

        console.log(`Publishing collection '${ID}'`)

        let response = await request(this.getAdminAccessToken());
        if (response.status === 401) {
            // Log.info("Not logged in when attempting to delete collection. Logging in as admin and trying again.")
            this.setAdminAccessToken(await this.loginAsRootAdmin());
            response = await request(this.getAdminAccessToken());
            if (response.status === 401) {
                Log.error("Login unsuccessful, so unable to publish collection");
                throw Error(`401: ${response.statusText}`);
            }
        }
        if (!response.ok) {
            throw Error(`${response.status}: ${response.statusText}`);
        }

        const publishedSuccessfully = await response.text();    
        if (!publishedSuccessfully) {
            throw Error(`Collection '${ID}' failed to publish`);
        }

        return publishedSuccessfully;
    }

    static async deleteTestCalendarEntry() {
        const collection = await this.createCollection({
            name: "Acceptance test collection - delete calendar entry " + (Math.floor(Math.random() * 1000000000)),
            type: "manual",
            teams: [],
            collectionOwner: "ADMIN"
        });

        await this.addPageDeleteToCollection("/releases/acceptancetestcalendarentry", collection.id);
        await this.approveCollection(collection.id);
        await this.publishCollection(collection.id);

        return collection;
    }

    static async createCalendarEntry(name, publishDate) {
        const collection = await this.createCollection({
            name: "Acceptance test collection - publish calendar entry " + (Math.floor(Math.random() * 1000000000)),
            type: "manual",
            teams: [],
            collectionOwner: "ADMIN"
        });

        const calendarEntryResponse = await fetch(`${path}/releases/acceptancetestcalendarentry/data`, {
            credentials: "include"
        });

        console.log("Response to checking whether test calendar entry is published: " + calendarEntryResponse.status);
        if (calendarEntryResponse.status === 200) {
            console.warn("Test calendar entry already exists and will be deleted");
            await this.deleteTestCalendarEntry();
        }
        
        const body = {
            dateChanges: [],
            description: {
                cancellationNotice:	[],
                cancelled: false,
                contact: {
                    email: "test@test.com",	
                    name: "Acceptance test",
                    telephone: "01234 567 890"
                },
                finalised: true,
                nationalStatistic: false,
                nextRelease: "",
                provisionalDate: "",	
                published: false,
                releaseDate: publishDate,
                summary: "",
                title: name
            },
            links: [],
            markdown: [],
            relatedDatasets: [],
            relatedDocuments: [],
            relatedMethodology: [],
            relatedMethodologyArticle: [],
            type: "release"
        }

        const saveResponse = await fetch(`${zebedeeURL}/content/${collection.id}?uri=/releases/acceptancetestcalendarentry/data.json`, {
            method: "POST",
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken()
            },
            body: JSON.stringify(body)
        });
        
        if (!saveResponse.ok) {
            throw Error(`Unable to create calendar entry - ${saveResponse.status}: ${saveResponse.statusText}`);
        }

        await this.reviewContentItem("/releases/acceptancetestcalendarentry", collection.id);
        await this.approveCollection(collection.id);
        await this.publishCollection(collection.id);

        const releaseIsLive = async () => {
            const response = await fetch(`${zebedeeURL}/publishedCollections/${collection.id}`, {
                headers: {
                    "X-Florence-Token": this.getTempUserAccessToken()
                }
            }).catch(error => {
                throw Error(error);
            });

            if (!response.ok) {
                console.error(`Error trying to check that test calendar entry is published - ${response.status}: ${response.statusText}`);
                return false;
            }

            const json = await response.json();

            if (!json[0] || !json[0].publishEndDate) {
                return false;
            }

            return true;
        }

        let isPublished = false;
        await interval(async (_, stop) => {
            isPublished = await releaseIsLive();
            if (isPublished) {
                stop();
            }
        }, 1000, {iterations: 7});

        if (!isPublished) {
            throw Error("Test calendar entry hasn't published successfully");
        }

        return collection;
    }

    static async addPageDeleteToCollection(URI, collectionID) {
        const response = await fetch(`${zebedeeURL}/DeleteContent`, {
            method: "POST",
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken()
            },
            body: JSON.stringify({
                uri: URI,
                collectionId: collectionID,
                user: this.getTempAdminUserEmail()
            })
        });

        if (!response.ok) {
            throw Error(`${response.status}: Error deleting published page '${URI}' in collection '${collectionID}'`);
        }
    }

    static async reviewContentItem(URI, collectionID) {
        const submitResponse = await fetch(`${zebedeeURL}/complete/${collectionID}?uri=${URI}/data.json`, {
            method: "POST",
            headers: {
                "X-Florence-Token": this.getTempUserAccessToken()
            }
        });

        if (!submitResponse.ok) {
            throw Error(`Unable to submit test calendar entry for review - ${submitResponse.status}: ${submitResponse.statusText}`);
        }

        const reviewResponse = await fetch(`${zebedeeURL}/review/${collectionID}?uri=${URI}/data.json`, {
            method: "POST",
            headers: {
                "X-Florence-Token": this.getAdminAccessToken()
            }
        });

        if (!reviewResponse.ok) {
            throw Error(`Unable to review test calendar entry - ${reviewResponse.status}: ${reviewResponse.statusText}`);
        }
    }
}

module.exports = Zebedee;