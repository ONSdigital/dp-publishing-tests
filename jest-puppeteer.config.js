module.exports = {
    launch: {
        dumpio: process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*',
        headless: process.env.DEBUG !== 'true' && process.env.DEBUG !== 'puppeteer:*',
        slowMo: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 30 : 0,
        timeout: (process.env.DEBUG === 'true' || process.env.DEBUG === 'puppeteer:*') ? 50000 : 30000,
    }
}