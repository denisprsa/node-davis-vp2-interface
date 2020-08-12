const request = require("request");
const fs = require("fs");
const DataStructure = require("../DataStructure");
const Logger = require("../Logger");
const { MongoClient } = require("mongodb");


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

class MongoDB {
    constructor() {
        this.collection = "data";
    }

    initialize(config) {
        return new Promise((resolve, reject) => {
            MongoClient.connect(config.mongodb.uri, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
                if (err) {
                    return reject(err);
                }

                this.db = client.db(config.mongodb.database);
                this.client = client;
                resolve();
            });
        });
    }

    async close() {
        if (this.client) {
            await this.client.close(true);
        }
    }

    async getLastArchiveTime() {
        const lastRecord = await this.db
            .collection(this.collection)
            .find({}, {projection:{_id: 0}})
            .sort({"date": -1})
            .limit(1)
            .toArray();

        return lastRecord.length ? lastRecord[0].date : null;
    }

    async getMeasurements(fromDate) {
        let query = {};

        if (fromDate) {
            query.date = {"$gt": fromDate};
        }

        const measurements = await this.db
            .collection(this.collection)
            .find(query, {projection:{_id: 0}})
            .sort({"date": 1})
            .toArray();

        return measurements;
    }

    async saveDataToArchive(measurements) {
        if (!measurements.length) {
            return 0;
        }

        const items = measurements.map(value => value.metricData);
        const response = await this.db
            .collection(this.collection)
            .insertMany(items);

        return response.insertedCount;
    }
}

async function getDataFromArchive(mongoDB, fromDate, allData = false) {
    let lines = await mongoDB.getMeasurements(fromDate);
    let arr = [];

    for (let line of lines) {
        arr.push(new DataStructure(
            line.date,
            line.temperature,
            line.dewPoint,
            line.humidity,
            line.barometer,
            line.avgWindSpeed,
            line.highWindSpeed,
            line.dirWindSpeed,
            line.rainfall
        ).convertToDatabaseObject());
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

async function updateDatabaseData(config, mongoDB) {
    let lastDate = await getLastServerTime(config);
    let data = await getDataFromArchive(mongoDB, lastDate);
    await sendDataToDatabase(config, data);
}

module.exports = {
    getLastServerTime,
    getDataFromArchive,
    sendDataToDatabase,
    updateDatabaseData,
    MongoDB
};