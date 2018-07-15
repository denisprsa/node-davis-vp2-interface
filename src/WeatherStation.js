
const SerialPort = require('./SerialPort');
const Logger = require('./Logger');
const GetDateBuffer = require('./helpers/get-date-buffer');
const CalculateCRC = require('./helpers/calculate-crc');
const ProcessArchiveData = require('./helpers/process-archive-data');
const GetWantedDate = require('./helpers/')
const fs = require('fs');

module.exports = class WeatherStation {
    constructor() {
        this.serialPort = new SerialPort('/home/pi/.wine/dosdevices/com3');
        this.ack = new Buffer(new Uint8Array([0x06]));
        this.crc_table = [
            0x0, 0x1021, 0x2042, 0x3063, 0x4084, 0x50a5, 0x60c6, 0x70e7,
            0x8108, 0x9129, 0xa14a, 0xb16b, 0xc18c, 0xd1ad, 0xe1ce, 0xf1ef,
            0x1231, 0x210, 0x3273, 0x2252, 0x52b5, 0x4294, 0x72f7, 0x62d6,
            0x9339, 0x8318, 0xb37b, 0xa35a, 0xd3bd, 0xc39c, 0xf3ff, 0xe3de,
            0x2462, 0x3443, 0x420, 0x1401, 0x64e6, 0x74c7, 0x44a4, 0x5485,
            0xa56a, 0xb54b, 0x8528, 0x9509, 0xe5ee, 0xf5cf, 0xc5ac, 0xd58d,
            0x3653, 0x2672, 0x1611, 0x630, 0x76d7, 0x66f6, 0x5695, 0x46b4,
            0xb75b, 0xa77a, 0x9719, 0x8738, 0xf7df, 0xe7fe, 0xd79d, 0xc7bc,
            0x48c4, 0x58e5, 0x6886, 0x78a7, 0x840, 0x1861, 0x2802, 0x3823,
            0xc9cc, 0xd9ed, 0xe98e, 0xf9af, 0x8948, 0x9969, 0xa90a, 0xb92b,
            0x5af5, 0x4ad4, 0x7ab7, 0x6a96, 0x1a71, 0xa50, 0x3a33, 0x2a12,
            0xdbfd, 0xcbdc, 0xfbbf, 0xeb9e, 0x9b79, 0x8b58, 0xbb3b, 0xab1a,
            0x6ca6, 0x7c87, 0x4ce4, 0x5cc5, 0x2c22, 0x3c03, 0xc60, 0x1c41,
            0xedae, 0xfd8f, 0xcdec, 0xddcd, 0xad2a, 0xbd0b, 0x8d68, 0x9d49,
            0x7e97, 0x6eb6, 0x5ed5, 0x4ef4, 0x3e13, 0x2e32, 0x1e51, 0xe70,
            0xff9f, 0xefbe, 0xdfdd, 0xcffc, 0xbf1b, 0xaf3a, 0x9f59, 0x8f78,
            0x9188, 0x81a9, 0xb1ca, 0xa1eb, 0xd10c, 0xc12d, 0xf14e, 0xe16f,
            0x1080, 0xa1, 0x30c2, 0x20e3, 0x5004, 0x4025, 0x7046, 0x6067,
            0x83b9, 0x9398, 0xa3fb, 0xb3da, 0xc33d, 0xd31c, 0xe37f, 0xf35e,
            0x2b1, 0x1290, 0x22f3, 0x32d2, 0x4235, 0x5214, 0x6277, 0x7256,
            0xb5ea, 0xa5cb, 0x95a8, 0x8589, 0xf56e, 0xe54f, 0xd52c, 0xc50d,
            0x34e2, 0x24c3, 0x14a0, 0x481, 0x7466, 0x6447, 0x5424, 0x4405,
            0xa7db, 0xb7fa, 0x8799, 0x97b8, 0xe75f, 0xf77e, 0xc71d, 0xd73c,
            0x26d3, 0x36f2, 0x691, 0x16b0, 0x6657, 0x7676, 0x4615, 0x5634,
            0xd94c, 0xc96d, 0xf90e, 0xe92f, 0x99c8, 0x89e9, 0xb98a, 0xa9ab,
            0x5844, 0x4865, 0x7806, 0x6827, 0x18c0, 0x8e1, 0x3882, 0x28a3,
            0xcb7d, 0xdb5c, 0xeb3f, 0xfb1e, 0x8bf9, 0x9bd8, 0xabbb, 0xbb9a,
            0x4a75, 0x5a54, 0x6a37, 0x7a16, 0xaf1, 0x1ad0, 0x2ab3, 0x3a92,
            0xfd2e, 0xed0f, 0xdd6c, 0xcd4d, 0xbdaa, 0xad8b, 0x9de8, 0x8dc9,
            0x7c26, 0x6c07, 0x5c64, 0x4c45, 0x3ca2, 0x2c83, 0x1ce0, 0xcc1,
            0xef1f, 0xff3e, 0xcf5d, 0xdf7c, 0xaf9b, 0xbfba, 0x8fd9, 0x9ff8,
            0x6e17, 0x7e36, 0x4e55, 0x5e74, 0x2e93, 0x3eb2, 0xed1, 0x1ef0,
        ];
    }

    /**
     * Wakes up weather station
     */
    async wakeUpStation() {
        // Send wake up signal
        await this.serialPort.open();
        await this.serialPort.write(Buffer.from('\n'));
        await this.serialPort.waiForDataToRead();
        let data = this.serialPort.read();
        
        // Check if response of Line Feed and Carriage Return characters
        if (Buffer.from('\n\r').equals(data)) {
            // Success
            Logger.log('Weather station woke up.');
            Logger.log('Sending "TEST" command.');

            // Test console with TEST command
            await this.serialPort.write(Buffer.from('TEST\n'));
            await this.serialPort.waiForDataToRead();
            let testData = this.serialPort.read();
            
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
        let testData = this.serialPort.read();

        // Check response from command DMPAFT
        if (!Buffer.from(new Uint8Array([0x06])).equals(testData)) {
            throw new Error('Invalid response from command "DMPAFT"');
        }

        // Calculate buffer data from date 
        // And CRC from data
        let data = GetDateBuffer(date);
        let crc = CalculateCRC(data);

        // Send DateTime and CRC
        await this.serialPort.write(Buffer.from(data));
        await this.serialPort.write(crc);
        await this.serialPort.waiForDataToRead();
        testData = this.serialPort.read();

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
                testData = this.serialPort.read();
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

    saveDataToFile(data) {
        let dataToSave = '';

        for (let d of data) {
            dataToSave += d.data + '\n'
        }

        fs.appendFileSync('data.csv', dataToSave);
    }

    getUint16(number) {
        return new Uint16Array([number])[0]
    }

    getLastDateFromArchive() {
        let data = fs.readFileSync('data.csv', 'utf-8');
        var lines = data.trim().split('\n');
        var lastLine = lines.slice(-1)[0];
        
        Logger.log('Last Time: ', lastLine);

        let arrayOfDataInLine = lastLine.split(',');
        let dateTimeArrayLine = arrayOfDataInLine[0].split(' ');
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
    }

    /**
     * Starts live reading from sensors
     */
    async startLiveReading(timeout) {
        if (timeout === undefined) {
            let wantedDate = GetWantedDate();
            let nowDate = new Date();
            timeout = wantedDate - nowDate;
        }

        Logger.log(`Waiting ${timeout / 1000} s`);

        let readData = new Promise((resolve, reject) => {
            setTimeout(async () => {
                Logger.log('Sending "LPS 2 1"')
                await this.serialPort.write(Buffer.from('LPS 2 1\n'));

                await this.serialPort.waiForDataToRead();
                let data = this.serialPort.read();
                let line = this.processLiveData(data);
                Logger.log('line', line);

                this.saveDataToFile([{data: line}]);

                try {
                    let wantedDate = GetWantedDate();
                    let nowDate = new Date();
                    await this.startLiveReading(wantedDate - nowDate);
                    resolve();
                } catch (e) {
                    reject(e);
                }
            }, timeout);
        });

        await readData();
    }

    processLiveData(data) {
        // Date Time
        let date = new Date();
        let day = date.getDate();
        let month = date.getMonth() + 1;
        let year = date.getFullYear();
        let hour = date.getHours();
        let minute = date.getMinutes();

        // Temperature
        let temperature = data.readInt16LE(10);
        temperature = ((temperature / 10) - 32) / 1.8;
        temperature = temperature.toFixed(1);

        // Rainfall
        let rainfall = data.readInt16LE(53);
        rainfall = rainfall * 0.2;

        // Barometer
        let barometer = data.readInt16LE(8);
        barometer = (barometer / 1000) * 33.863753
        barometer = barometer.toFixed(1);

        // Humidity
        let humidity = data.readUInt8(34);

        // Avg wind speed
        let avgWindSpeed = data.readUInt8(15);
        avgWindSpeed = avgWindSpeed * 1.60934;
        avgWindSpeed = avgWindSpeed.toFixed(1);

        // High wind speed
        let highWindSpeed = data.readUInt8(23);
        highWindSpeed = highWindSpeed * 1.60934;
        highWindSpeed = highWindSpeed.toFixed(1);

        // Direction wind speed
        let dirWindSpeed = data.readUInt8(17);

        // Dew point
        let dewPoint = data.readInt16LE(31);
        dewPoint = ((dewPoint) - 32) / 1.8;
        dewPoint = dewPoint.toFixed(1);

        let line = `${day}.${month}.${year} ${hour}:${minute},${temperature},${dewPoint},${humidity},${barometer},${avgWindSpeed},${highWindSpeed},${dirWindSpeed},${rainfall},`
        Logger.log(line);
        return line;
    }

    async close() {
        await this.serialPort.close();
    }
}