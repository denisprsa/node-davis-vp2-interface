
const { describe, it, before } = require('mocha');
const fs = require('fs');
const path = require('path')
const assert = require('assert');
const database = require('../src/helpers/database');

describe('Should test database file', () => {
    it('should remove line if not valid', async () => {
        let config = {
            fileDBLocation: path.join(__dirname, 'files/error-data.csv'),
            fileDBLocationSave: path.join(__dirname, 'files/error-data-save.csv')
        };
        let lines = database.getDataFromArchive(config);
    });
});


describe('should test mongodb', () => {
    let mongodb;
    let date = new Date();
    let databaseName = Date.now();

    before(async () => {
        mongodb = new database.MongoDB();
        await mongodb.initialize({
            mongodb: {
                uri: "mongodb://localhost:27017",
                database: `${databaseName}`
            }
        });
    });

    after(async () => {
        await mongodb.db.dropDatabase();
        await mongodb.close();
    });

    it('should insert record', async () => {
        const measurements = [{ metricData: {
            date: date,
            temperature: 1.3,
            dewPoint: 1.1,
            humidity: 97,
            barometer: 1009,
            avgWindSpeed: 5.3,
            highWindSpeed: 10.3,
            directionWind: 200,
            rainfall: 0.8
        }}];
        const inserted = await mongodb.saveDataToArchive(measurements);
        assert.strictEqual(inserted, 1);
    });

    it('should get record', async () => {
        const records = await mongodb.getMeasurements();
        assert.deepStrictEqual(records, [{
            date: date,
            temperature: 1.3,
            dewPoint: 1.1,
            humidity: 97,
            barometer: 1009,
            avgWindSpeed: 5.3,
            highWindSpeed: 10.3,
            directionWind: 200,
            rainfall: 0.8
        }]);
    });

    it('should return only date newer', async () => {
        let olderDate = new Date();
        olderDate.setDate(olderDate.getDate() - 1);
        let queryOlderDate = new Date();
        queryOlderDate.setHours(olderDate.getHours() - 1);
        
        const measurements = [{ metricData: {
            date: olderDate,
            temperature: 2.3,
            dewPoint: 4.1,
            humidity: 87,
            barometer: 1003,
            avgWindSpeed: 6.3,
            highWindSpeed: 11.3,
            directionWind: 112,
            rainfall: 0.2
        }}];
        const inserted = await mongodb.saveDataToArchive(measurements);
        assert.strictEqual(inserted, 1);

        const records = await mongodb.getMeasurements(queryOlderDate);
        assert.deepStrictEqual(records, [{
            date: date,
            temperature: 1.3,
            dewPoint: 1.1,
            humidity: 97,
            barometer: 1009,
            avgWindSpeed: 5.3,
            highWindSpeed: 10.3,
            directionWind: 200,
            rainfall: 0.8
        }]);
    });

    it('should return latest record by date', async () => {
        const record = await mongodb.getLastArchiveTime();
        assert.deepStrictEqual(record, date);
    });
})

