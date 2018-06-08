
module.exports = class Log {

    static info(message) {
        console.info(message);
    }

    static debug(message) {
        console.debug(message);
    }

    static success(message) {
        console.log(message);
    }
    
    static error(message) {
        console.error(message);
    }
    
    static warn(message) {
        console.warn(message);
    }

}