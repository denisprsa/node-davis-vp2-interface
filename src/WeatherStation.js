
const SerialPort = require('./SerialPort');
const Logger = require('./Logger');
const GetDateBuffer = require('./helpers/get-date-buffer');
const CalculateCRC = require('./helpers/calculate-crc');
const ProcessArchiveData = require('./helpers/process-archive-data');
const GetWantedDate = require('./helpers/get-wanted-date');
const SaveDataToFile = require('./helpers/save-data-to-file');
const ProcessLiveData = require('./helpers/process-live-data');
const SendDataToServer = require('./helpers/update-database');
const SendDataWU = require('./helpers/send-to-wu');
const fs = require('fs');

module.exports = class WeatherStation {
    constructor(config) {
        this.config = config;
        this.serialPort = new SerialPort(config.serialPort);
        this.ack = new Buffer(new Uint8Array([0x06]));
        this.portOpened = false;
    }

    /**
     * Wakes up weather station
     */
    async wakeUpStation() {
        // Send wake up signal
        await this.serialPort.open();
        this.portOpened = true;
        await this.serialPort.write(Buffer.from('\n'));
        await this.serialPort.waiForDataToRead();
        let data = await this.serialPort.read();
        
        // Check if response of Line Feed and Carriage Return characters
        if (Buffer.from('\n\r').equals(data)) {
            // Success
            Logger.log('Weather station woke up.');
            Logger.log('Sending "TEST" command.');

            // Test console with TEST command
            await this.serialPort.write(Buffer.from('TEST\n'));
            await this.serialPort.waiForDataToRead();
            let testData = await this.serialPort.read();
            
            // Expect response to equal \n\rTEST\n\r
            if (Buffer.from('\n\rTEST\n\r').equals(testData)) {
                Logger.log('Command "TEST" successful.');
            } else {
                Logger.log('Command "TEST" failed.');
                throw new (Error('Command TEST failed'));
            }

            return;
        }

        throw new Error()
    }

    /**
     * Reads from archive
     */
    async readFromArchive(fromDate) {
        // Send DMPAFT command
        Logger.log('Sending DMPAFT')
        await this.serialPort.write(Buffer.from('DMPAFT\n'));
        await this.serialPort.waiForDataToRead();
        let testData = await this.serialPort.read();

        // Check response from command DMPAFT
        if (!Buffer.from(new Uint8Array([0x06])).equals(testData)) {
            throw new Error('Invalid response from command "DMPAFT"');
        }

        // Calculate buffer data from date 
        // And CRC from data
        let data = GetDateBuffer(fromDate);
        let crc = CalculateCRC(data);

        // Send DateTime and CRC
        await this.serialPort.write(Buffer.from(data));
        await this.serialPort.write(crc);
        await this.serialPort.waiForDataToRead();
        testData = await this.serialPort.read();

        // Get number of pages and starting row
        let pages = testData.readInt16LE(1);
        let row = testData.readInt16LE(3);

        console.log('PAGE: ', pages);
        console.log('ROW: ', row);
        
        // ACK to start receiving measurements
        await this.serialPort.write(this.ack);

        // Read archive
        let read = true;
        let archiveData = [];

        try {
            while (read) {
                await this.serialPort.waiForDataToRead();
                testData = await this.serialPort.read();
                archiveData = archiveData.concat(ProcessArchiveData(testData, fromDate, row));
                row = undefined;
                await this.serialPort.write(this.ack);
            }
        } catch (e) {
            if (e.message !== 'No data') {
                throw e;
            }
        }

        return archiveData;
    }

    getLastDateFromArchive(config) {
        while (true) {
            let data = fs.readFileSync(config.fileDBLocation, 'utf-8');
            var lines = data.trim().split('\n');
            var lastLine = lines.slice(-1)[0];
            
            Logger.log(lastLine);

            let arrayOfDataInLine = lastLine.split(',');
            let dateTimeArrayLine = arrayOfDataInLine[0].split(' ');

            if (dateTimeArrayLine[0] && dateTimeArrayLine[1]) {
                let dateArrayLine = dateTimeArrayLine[0].split('.');
                let timeArrayLine = dateTimeArrayLine[1].split(':');

                let lastDate = new Date();
                lastDate.setFullYear(parseInt(dateArrayLine[2]));
                lastDate.setMonth(parseInt(dateArrayLine[1] - 1));
                lastDate.setDate(dateArrayLine[0]);
                lastDate.setHours(timeArrayLine[0]);
                lastDate.setMinutes(timeArrayLine[1]);
                lastDate.setSeconds(0);
                lastDate.setMilliseconds(0);

                return lastDate;
            } else {
                data = fs.readFileSync(config.fileDBLocation, 'utf-8');
                
                let splitted = data.split('\n');
                splitted.splice(splitted.length - 1, 1);
                let allLinesExceptLast = splitted.join('\n');
                fs.writeFile(config.fileDBLocation, allLinesExceptLast);
            }
        }
    }

    /**
     * Starts live reading from sensors
     */
    startLiveReading(config, timeout) {
        if (timeout === undefined) {
            let wantedDate = GetWantedDate();
            let nowDate = new Date();
            timeout = wantedDate - nowDate;
        }

        Logger.log(`Waiting ${timeout / 1000} s`);

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                Logger.log('Sending "LPS 2 1"')
                await this.serialPort.write(Buffer.from('LPS 2 1\n'));

                await this.serialPort.waiForDataToRead();
                let data = await this.serialPort.read();
                let processedData = ProcessLiveData(data, config);
                Logger.log('line', processedData.line);

                SaveDataToFile([{data: processedData.line}], config.fileDBLocation);

                let date = new Date();
                let wuDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate() + 1} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;

                let wundergroundURL = 'https://weatherstation.wunderground.com/weatherstation/updateweatherstation.php?';
                wundergroundURL += `ID=${config.wuID}`;
                wundergroundURL += `&PASSWORD=${config.wuPASS}`;
                wundergroundURL += `&dateutc=${encodeURIComponent(wuDate)}`;
                wundergroundURL += `&winddir=${processedData.dirWindSpeed}`;
                wundergroundURL += `&windspeedmph=${processedData.avgWindSpeed}`;
                wundergroundURL += `&windgustmph=${processedData.highWindSpeed}`;
                wundergroundURL += `&tempf=${processedData.temperature}`;
                wundergroundURL += `&rainin=${processedData.rainfall}`;
                wundergroundURL += `&baromin=${processedData.barometer}`;
                wundergroundURL += `&dewptf=${processedData.dewPoint}`;
                wundergroundURL += `&humidity=${processedData.humidity}`;
                
                try {
                    await SendDataWU(wundergroundURL);
                } catch (e) {
                    Logger.error(e);
                }

                try {
                    await SendDataToServer(config);
                } catch (e) {
                    Logger.error(e);
                }

                try {
                    let wantedDate = GetWantedDate();
                    let nowDate = new Date();
                    await this.startLiveReading(config, wantedDate - nowDate);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            }, timeout);
        });
    }

    async close() {
        if (this.portOpened) {
            await this.serialPort.close();
        }
    }
}