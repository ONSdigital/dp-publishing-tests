module.exports = {
    launch: {
        dumpio: process.env.DEBUG === 'true',
        headless: process.env.DEBUG !== 'true',
        slowMo: process.env.DEBUG === 'true' ? 20 : 0,
        timeout: 10000
    }
}