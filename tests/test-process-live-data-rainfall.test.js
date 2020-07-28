
const { describe, it } = require('mocha');
const fs = require('fs');
const path = require('path')
const assert = require('assert');
const ProcessLiveDataRainFall = require('../src/helpers/process-live-data-rainfall');


describe('Process live rainfall', () => {
    it('calculate correct value', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data.csv'), 'utf-8');
        let rain = ProcessLiveDataRainFall(new Date('2018-7-16 10:22'), 0.2, lines);
        assert.strictEqual(rain, 0.0);
    });

    it('calculate correct value', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data.csv'), 'utf-8');
        let rain = ProcessLiveDataRainFall(new Date('2018-7-16 10:22'), 0.4, lines);
        assert.strictEqual(rain, 0.2);
    });

    it('calculate correct value', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data.csv'), 'utf-8');
        let rain = Number(ProcessLiveDataRainFall(new Date('2018-7-16 10:22'), 0.8, lines).toFixed(1));
        assert.strictEqual(rain, 0.6);
    });
});


describe('Error when processing rain', () => {
    it('returns -0.2 because of 1 minute overlay', async () => {
        let lines = fs.readFileSync(path.join(__dirname, 'files/data-error-miss-match.csv'), 'utf-8');
        let rain = ProcessLiveDataRainFall(new Date('2018-9-1 11:2'), 0, lines);
        assert.strictEqual(rain, -0.2);
    });
});
