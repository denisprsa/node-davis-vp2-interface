
const { describe, it } = require('mocha');
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
        console.log(config);
        let lines = database.getDataFromArchive(config);
        console.log(lines);
    });
});
