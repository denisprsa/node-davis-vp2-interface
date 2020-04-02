const checkForNetwork = require("./check-for-network");
const Logger = require("../Logger");
const exec = require("child_process").exec;
const path = require("path");

function wait() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, 1000);
    });
}

module.exports = async function() {
    let networkAvailable = false;

    do {
        try {
            await checkForNetwork();
            networkAvailable = true;
        } catch(e) {
            if (e.code === "ETIMEOUT") {
                process.exit(1);
            }

            Logger.log(e);
        }

        await wait();
    } while(networkAvailable === false);

    let pathToScript = path.join(__dirname, "..", "scripts", "update-time.sh");

    return await new Promise((resolve, reject) => {
        exec(`sh ${pathToScript}`, (error, stdout, stderr) => {
            Logger.log(`out ${stdout}`);

            if (stderr !== null && stderr.length > 0) {
                Logger.log(`exec error: ${stderr}`);
                return reject(stderr);
            }

            resolve();
        });
    });
};