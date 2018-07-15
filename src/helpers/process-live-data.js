const Logger = require('../Logger');
const ProcessLiveDataRainFall = require('./process-live-data-rainfall');

module.exports = (data, config) => {
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

    ProcessLiveDataRainFall(date, rainfall, config);

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
};
