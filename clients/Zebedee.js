const fetch = require('node-fetch');
const Log = require('../src/utilities/Log');

const path = process.env.ENVIRONMENT_URL;
const zebedeePath = process.env.ZEBEDEE_PATH;
const zebedeeURL = `${path}${zebedeePath}`;
const adminCredentials = {
    email: process.env.ROOT_ADMIN_EMAIL,
    password: process.env.ROOT_ADMIN_PASSWORD
};
const tempAdminUserEmail = "automated-admin@email.com";
const tempAdminUserPassword = process.env.TEMP_USER_PASSWORD;

module.exports = class Zebedee {

    static async initialise() {
        Log.info("Zebedee initialisation started");

        if (!zebedeePath) {
            Log.warn("Unable to setup and start tests because no path for Zebedee API was provided\nSet environment variable ZEBEDEE_PATH with a valid path");
            throw Error("Zebedee path not provided");
        }

        if (!adminCredentials.email || !adminCredentials.password) {
            Log.warn("Unable to setup and start tests because root admin email or password not provided\nSet environment variables ROOT_ADMIN_EMAIL and ROOT_ADMIN_PASSWORD with valid credentials");
            throw Error("Root admin credentials not provided");
        }

        if (!tempAdminUserPassword) {
            Log.warn("Unable to setup and start tests because no password for the temporary admin account was provided\nSet environment variable TEMP_USER_PASSWORD with a valid password");
            throw Error("Temproary admin account's password not provided");
        }

        const adminAccessToken = await this.loginAsRootAdmin();
        const tempUserAccessToken = await this.createTempAdminUser(adminAccessToken);

        global.accessToken = tempUserAccessToken;

        Log.info("Zebedee initialisation finished");
    }

    static async createTempAdminUser(adminAccessToken) {
        let tempUserAlreadyExists = false;
        const tempPassword = "to be changed";
        const password = "a new test password";
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
                Log.warn("Temporary admin user already exists")
                tempUserAlreadyExists = true;
            }
            return response.json();
        }).catch(error => {
            Log.error(error);
        });

        if (tempUserAlreadyExists) {
            Log.warn("Deleting existing temporary admin user");
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
                signal.fatal(error);
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

        return accessToken;
    }

    static async cleanup() {
        const accessToken = await this.loginAsRootAdmin();
        await this.removeTempAdminUser(accessToken);
        Log.success("Finished cleaning up environment");
    }
}