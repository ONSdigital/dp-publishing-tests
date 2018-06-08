const screenshotDir = "./screenshots/";
const florenceURL = process.env.ENVIRONMENT_URL + "/florence";

export default class Page {
    
    static async initialise() {
        page = await browser.newPage("");
        await page.setViewport({width: 1920, height: 979});
        page.on('console', msg => {
            for (let i = 0; i < msg.args.length; ++i) {
                console.log(`${i}: ${msg.args[i]}`);
            }
        });
    }

    static async goto(path) {
        return await page.goto(`${florenceURL}${path}`);
    }

    static async screenshot(name) {
        await page.screenshot({
            path: `${screenshotDir}${name}.png`
        });
    }
}