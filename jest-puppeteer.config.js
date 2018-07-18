module.exports = {
    launch: {
        dumpio: process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*',
        headless: (process.env.DEBUG !== 'true' && process.env.DEBUG !== 'puppeteer:*') && (process.env.HEADLESS !== 'false'),
        slowMo: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 100 : 0,
        timeout: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 50000 : 30000,
    }
}