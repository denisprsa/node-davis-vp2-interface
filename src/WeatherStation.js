
const SerialPort = require("./SerialPort");
const Logger = require("./Logger");
const GetDateBuffer = require("./helpers/get-date-buffer");
const CalculateCRC = require("./helpers/calculate-crc");
const ProcessArchiveData = require("./helpers/process-archive-data");
const GetWantedDate = require("./helpers/get-wanted-date");
const ProcessLiveData = require("./helpers/process-live-data");
const { updateDatabaseData, getLastServerTime } = require("./helpers/database");
const SendDataWU = require("./helpers/send-to-wu");

module.exports = class WeatherStation {
    constructor(config) {
        this.config = config;
        this.serialPort = new SerialPort(config.serialPort);
        this.ack = new Buffer(new Uint8Array([0x06]));
        this.portOpened = false;
    }

    async wakeUpStation() {
        // Send wake up signal
        await this.serialPort.open();
        this.portOpened = true;
        await this.serialPort.write(Buffer.from("\n"));
        await this.serialPort.waiForDataToRead();
        let data = await this.serialPort.read();
        
        // Check if response of Line Feed and Carriage Return characters
        if (Buffer.from("\n\r").equals(data)) {
            // Success
            Logger.log("Weather station woke up.");
            Logger.log("Sending \"TEST\" command.");

            // Test console with TEST command
            await this.serialPort.write(Buffer.from("TEST\n"));
            await this.serialPort.waiForDataToRead();
            let testData = await this.serialPort.read();
            
            // Expect response to equal \n\rTEST\n\r
            if (Buffer.from("\n\rTEST\n\r").equals(testData)) {
                Logger.log("Command \"TEST\" successful.");
            } else {
                Logger.log("Command \"TEST\" failed.");
                throw new (Error("Command TEST failed"));
            }

            return;
        }

        throw new Error();
    }

    /**
     * Reads from archive
     */
    async readFromArchive(fromDate) {
        // Send DMPAFT command
        Logger.log("Sending DMPAFT");
        await this.serialPort.write(Buffer.from("DMPAFT\n"));
        await this.serialPort.waiForDataToRead();
        let testData = await this.serialPort.read();

        // Check response from command DMPAFT
        if (!Buffer.from(new Uint8Array([0x06])).equals(testData)) {
            throw new Error("Invalid response from command \"DMPAFT\"");
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

        Logger.log("PAGE: ", pages);
        Logger.log("ROW: ", row);
        
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
            if (e.message !== "No data") {
                throw e;
            }
        }

        return archiveData;
    }

    async getLastDateFromArchive(config) {
        try {
            return await getLastServerTime(config);
        } catch (e) {
            Logger.error(e);
        }

        const oldestDate = new Date();
        oldestDate.setDate(oldestDate.getDate() - 20);

        return oldestDate;
    }

    /**
     * Starts live reading from sensors
     */
    startLiveReading(config, mongoDB, timeout) {
        if (timeout === undefined) {
            let wantedDate = GetWantedDate();
            let nowDate = new Date();
            timeout = wantedDate - nowDate;
        }

        Logger.log(`Waiting ${timeout / 1000} s`);

        return new Promise((resolve, reject) => {
            setTimeout(async () => {
                Logger.log("Sending \"LPS 2 1\"");
                await this.serialPort.write(Buffer.from("LPS 2 1\n"));

                await this.serialPort.waiForDataToRead();
                const data = await this.serialPort.read();
                const currentDate = new Date();
                currentDate.setSeconds(0);
                currentDate.setMilliseconds(0);
                currentDate.setMinutes(currentDate.getMinutes() - 60);
                const lastHourMeasurements = await mongoDB.getMeasurements(currentDate);
                let processedData = ProcessLiveData(data, lastHourMeasurements);

                Logger.log("line", processedData.line);

                await mongoDB.saveDataToArchive([processedData]);

                let date = new Date();
                let wuDate = `${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()} ${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;

                let wundergroundURL = config.wundergroundURL;
                wundergroundURL += `ID=${config.wuID}`;
                wundergroundURL += `&PASSWORD=${config.wuPASS}`;
                wundergroundURL += `&dateutc=${encodeURIComponent(wuDate)}`;
                wundergroundURL += `&winddir=${processedData.USData.dirWindSpeed}`;
                wundergroundURL += `&windspeedmph=${processedData.USData.avgWindSpeed}`;
                wundergroundURL += `&windgustmph=${processedData.USData.highWindSpeed}`;
                wundergroundURL += `&tempf=${processedData.USData.temperature}`;
                wundergroundURL += `&rainin=${processedData.USData.rainfall}`;
                wundergroundURL += `&baromin=${processedData.USData.barometer}`;
                wundergroundURL += `&dewptf=${processedData.USData.dewPoint}`;
                wundergroundURL += `&humidity=${processedData.USData.humidity}`;
                
                Logger.log("WUNDERGROUND", wundergroundURL);

                try {
                    await SendDataWU(wundergroundURL);
                } catch (e) {
                    Logger.error(e);
                }

                try {
                    await updateDatabaseData(config, mongoDB);
                } catch (e) {
                    Logger.error(e);
                }

                try {
                    let wantedDate = GetWantedDate();
                    let nowDate = new Date();
                    await this.startLiveReading(config, mongoDB, wantedDate - nowDate);
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
};