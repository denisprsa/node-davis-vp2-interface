

const logger = class Logger {
    static log(message) {
        console.log(message);
    }

    static error(message) {
        console.error(message);
    }
};

module.exports = logger;
