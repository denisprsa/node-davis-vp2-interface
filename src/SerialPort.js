const SerialPort = require('serialport');
const Logger = require('./Logger');

const serialPortManager = class SerialPortManager {
    constructor(path) {
        this.path = path;
        this.serial = new SerialPort(path, { baudRate: 19200, autoOpen: false });
        this.readable = false;
    }

    readablePortWatch() {
        this.serial.on('readable', () => {
            console.log('readable')
            this.readable = true;
        })
    }

    open() {
        return new Promise((resolve, reject) => {
            this.serial.open((err) => {
                if (err) {
                    return reject(err);
                }
            
                Logger.log(`Serial port "${this.path}" opened.`);
                this.readablePortWatch();
                resolve();
            });
        });
    }

    write(bufferToWrite) {
        return new Promise((resolve, reject) => {
            this.serial.write(bufferToWrite, async (err, bytesWritten) => {
                if (err) {
                    return reject(err);
                }

                Logger.log(`Data written to serial port`);
                resolve();
            });
        });
    }

    read() {
        return this.serial.read();
    }

    waiForDataToRead() {
        return new Promise((resolve, reject) => {
            let wait = (count) => {
                setTimeout(() => {
                    if (this.readable) {
                        this.readable = false;
                        return resolve();
                    } else if (count > 20) {
                        return reject(new Error('No data'));
                    } else {
                        wait(count + 1);
                    }
                }, 100);
            };
            wait(0);
        });
    }

    close() {
        return new Promise((resolve, reject) => {
            this.serial.close(err => {
                if (err) {
                    return reject(err);
                }

                resolve();
            });
        });
    }
}

module.exports = serialPortManager;
