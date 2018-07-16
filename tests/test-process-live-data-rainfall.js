
const { describe, it } = require('mocha');
const fs = require('fs');
const path = require('path')
const assert = require('assert');
const ProcessLiveDataRainFall = require('../src/helpers/process-live-data-rainfall');


describe('Process live rainfall', () => {
    it('calculate correct value', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data.csv'), 'utf-8');
        let rain = ProcessLiveDataRainFall(new Date('2018-7-16 10:22'), 0.2, lines);
        assert.equal(rain, 0.0);
    });

    it('calculate correct value', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data.csv'), 'utf-8');
        let rain = ProcessLiveDataRainFall(new Date('2018-7-16 10:22'), 0.4, lines);
        assert.equal(rain, 0.2);
    });

    it('calculate correct value', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data.csv'), 'utf-8');
        let rain = ProcessLiveDataRainFall(new Date('2018-7-16 10:22'), 0.8, lines).toFixed(1);
        assert.equal(rain, 0.6);
    });
});
