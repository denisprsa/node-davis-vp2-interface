const request = require("request");
const Logger = require("../Logger");


module.exports = async (url) => {
    return new Promise((resolve, reject) => {
        request.get(url, {timeout:30000}, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }

            Logger.log(body);
            resolve();
        });
    });
};