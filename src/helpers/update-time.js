const checkForNetwork = require('./check-for-network');
const Logger = require('../Logger');
const exec = require('child_process').exec;
const path = require('path');

function wait() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });
}

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

            await wait();
        } while(networkAvailable === false);

        let pathToScript = path.join(__dirname, '..', 'scripts', 'update-time.sh')

        exec(`sh ${pathToScript}`, (error, stdout, stderr) => {
            Logger.log(`out ${stdout}`);

            if (stderr !== null && stderr.length > 0) {
                Logger.log(`exec error: ${stderr}`);
                return reject(stderr);
            }

            resolve();
        });
    });
}