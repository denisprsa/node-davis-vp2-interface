const request = require('request');
const fs = require('fs');
const DataStructure = require('../DataStructure');

function getLastServerTime(config) {
    return new Promise((resolve, reject) => {
        request.get(config.getLastDatabaseDateURL, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }

            resolve(new Date(body.date));
        });
    });
}

function getDataFromArchive(config, fromDate) {
    let data = fs.readFileSync(config.fileDBLocation, 'utf-8');
    let lines = data.trim().split('\n');
    let arr = [];

    for (line of lines) {
        let arrayOfDataInLine = line.split(',');
        let dateTimeArrayLine = arrayOfDataInLine[0].split(' ');
        let dateArrayLine = dateTimeArrayLine[0].split('.');
        let timeArrayLine = dateTimeArrayLine[1].split(':');
    
        let archiveDate = new Date();
        archiveDate.setFullYear(parseInt(dateArrayLine[2]));
        archiveDate.setMonth(parseInt(dateArrayLine[1] - 1));
        archiveDate.setDate(dateArrayLine[0]);
        archiveDate.setHours(timeArrayLine[0]);
        archiveDate.setMinutes(timeArrayLine[1]);
        archiveDate.setSeconds(0);
        archiveDate.setMilliseconds(0);

        if (archiveDate > fromDate) {
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
    return new Promise((resolve, reject) => {
        request.post(config.saveDatabaseData, { json: data }, (err, httpResponse, body) => {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
}

module.exports = async (config) => {
    let lastDate = await getLastServerTime(config);
    let data = getDataFromArchive(config, lastDate);
    await sendDataToDatabase(config, data);
}