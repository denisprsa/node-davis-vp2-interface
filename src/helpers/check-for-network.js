let dns = require("dns");

module.exports = function checkForNetwork() {
    return new Promise((resolve, reject) => {
        dns.resolve("www.google.com", (err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};
