const request = require("request");
const fs = require("fs");
const DataStructure = require("../DataStructure");
const Logger = require("../Logger");

function getLastServerTime(config) {
    return new Promise((resolve, reject) => {
        request.get(config.getLastDatabaseDateURL, {timeout:30000}, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }

            let bodyData = JSON.parse(body);
            Logger.log("Last time from DB: " + bodyData.date);
            resolve(new Date(bodyData.date));
        });
    });
}

function getLastArchiveTime(config) {
    const archiveData = getDataFromArchive(config, "", true);
    const lastLine = archiveData[archiveData.length - 1];

    return new Date(lastLine.timestamp * 1000);
}

function saveDataToArchive(measurements, config) {
    const archiveData = getDataFromArchive(config, "", true);
    const lastLine = archiveData[archiveData.length - 1];

    for (let measurement of measurements) {
        if (new Date(lastLine.timestamp * 1000) < measurement.metricData.date) {
            fs.appendFileSync(config.fileDBLocation, measurement.line + "\n");
        }
    }
}

function validateArchiveData(config) {
    let data = fs.readFileSync(config.fileDBLocation, "utf-8");
    let lines = data.trim().split("\n");
    let validatedLines = [];

    for (let line of lines) {
        if (line.includes(",")) {
            validatedLines.push(line);
        }
    }

    fs.writeFileSync(config.fileDBLocationSave || config.fileDBLocation, `${validatedLines.join("\n")}\n`, "utf-8");
    return validatedLines;
}

function getDataFromArchive(config, fromDate, allData = false) {
    let lines = validateArchiveData(config);
    let arr = [];

    for (let line of lines) {
        let arrayOfDataInLine = line.split(",");
        let dateTimeArrayLine = arrayOfDataInLine[0].split(" ");
        let dateArrayLine = dateTimeArrayLine[0].split(".");
        let timeArrayLine = dateTimeArrayLine[1].split(":");
    
        let archiveDate = new Date();
        archiveDate.setFullYear(parseInt(dateArrayLine[2]));
        archiveDate.setMonth(parseInt(dateArrayLine[1] - 1));
        archiveDate.setDate(dateArrayLine[0]);
        archiveDate.setHours(timeArrayLine[0]);
        archiveDate.setMinutes(timeArrayLine[1]);
        archiveDate.setSeconds(0);
        archiveDate.setMilliseconds(0);

        if (archiveDate > fromDate || allData) {
            arr.push(new DataStructure(
                archiveDate,
                arrayOfDataInLine[1],
                arrayOfDataInLine[2],
                arrayOfDataInLine[3],
                arrayOfDataInLine[4],
                arrayOfDataInLine[5],
                arrayOfDataInLine[6],
                arrayOfDataInLine[7],
                arrayOfDataInLine[8],
            ).convertToDatabaseObject());
        }
    }

    return arr;
}

function sendDataToDatabase(config, data) {
    Logger.log(data);
    return new Promise((resolve, reject) => {
        request.post(config.saveDatabaseData, { json: { data: data }, timeout: 30000}, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }

            Logger.log(body);
            resolve();
        });
    });
}

async function updateDatabaseData(config) {
    let lastDate = await getLastServerTime(config);
    let data = getDataFromArchive(config, lastDate);
    await sendDataToDatabase(config, data);
}

module.exports = {
    getLastServerTime,
    getLastArchiveTime,
    getDataFromArchive,
    sendDataToDatabase,
    updateDatabaseData,
    saveDataToArchive
};