const checkForNetwork = require('./check-for-network');
const Logger = require('../Logger');
const exec = require('child_process').exec;
const path = require('path');

module.exports = function() {
    return new Promise(async (resolve, reject) => {
        let networkAvailable = false;

        do {
            try {
                await checkForNetwork();
                networkAvailable = true;
            } catch(e) {
                Logger.log(e);
            }
        } while(networkAvailable === false);

        let pathToScript = path.join(__dirname, '..', 'scripts', 'update-time.sh')

        exec(`sh ${pathToScript}`, (error, stdout, stderr) => {
            Logger.log(`${stdout}`);
            Logger.log(`${stderr}`);

            if (stderr !== null) {
                Logger.log(`exec error: ${stderr}`);
                return reject(stderr);
            }

            resolve();
        });
    });
}