module.exports = {
    launch: {
        dumpio: process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*',
        headless: process.env.DEBUG !== 'true' && process.env.DEBUG !== 'puppeteer:*',
        slowMo: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 50 : 0,
        timeout: 10000
    }
}