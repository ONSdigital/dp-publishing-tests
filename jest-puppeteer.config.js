module.exports = {
    launch: {
        dumpio: process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*',
        headless: process.env.DEBUG !== 'true' && process.env.DEBUG !== 'puppeteer:*',
        slowMo: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 50 : 0,
        timeout: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 20000 : 5000,
        // executablePath: "/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
    }
}