const Logger = require("../Logger");
const ProcessLiveDataRainFall = require("./process-live-data-rainfall");
const fs = require("fs");

module.exports = (data, lastHourMeasurements) => {
    // Date Time
    let date = new Date();
    date.setSeconds(0);
    date.setMilliseconds(0);
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours();
    let minute = date.getMinutes();
    let USData = {};
    let metricData = {};
    metricData.date = date;

    // Temperature
    let temperature = data.readInt16LE(13);
    USData.temperature = (temperature / 10);
    temperature = ((temperature / 10) - 32) / 1.8;
    temperature = temperature.toFixed(1);
    metricData.temperature = temperature;

    // Rainfall
    let rainfall1H = data.readInt16LE(55);
    let rainfall = rainfall1H * 0.2;

    rainfall = ProcessLiveDataRainFall(new Date(date), rainfall, lastHourMeasurements);
    if (rainfall < 0) {
        rainfall = 0;
    }

    metricData.rainfall = rainfall;
    USData.rainfall = rainfall * 0.0393701;

    // Barometer
    let barometer = data.readInt16LE(8);
    USData.barometer = (barometer / 1000);
    barometer = (barometer / 1000) * 33.863753;
    barometer = barometer.toFixed(1);
    metricData.barometer = barometer;

    // Humidity
    let humidity = data.readUInt8(34);
    USData.humidity = humidity;
    metricData.humidity = humidity;

    // Avg wind speed
    let avgWindSpeed = data.readUInt8(15);
    avgWindSpeed = avgWindSpeed / 2;
    USData.avgWindSpeed = avgWindSpeed;
    avgWindSpeed = avgWindSpeed * 1.60934;
    avgWindSpeed = avgWindSpeed.toFixed(1);
    metricData.avgWindSpeed = avgWindSpeed;

    // High wind speed
    let highWindSpeed = data.readInt16LE(23);
    highWindSpeed = highWindSpeed / 2;
    USData.highWindSpeed = highWindSpeed;
    highWindSpeed = highWindSpeed * 1.60934;
    highWindSpeed = highWindSpeed.toFixed(1);
    metricData.highWindSpeed = highWindSpeed;

    // Direction wind speed
    let dirWindSpeed = data.readInt16LE(17);
    USData.dirWindSpeed = dirWindSpeed;
    metricData.dirWindSpeed = dirWindSpeed;

    // Dew point
    let dewPoint = data.readInt16LE(31);
    USData.dewPoint = dewPoint;
    dewPoint = ((dewPoint) - 32) / 1.8;
    dewPoint = dewPoint.toFixed(1);
    metricData.dewPoint = dewPoint;

    let line = `${day}.${month}.${year} ${hour}:${minute},${temperature},${dewPoint},${humidity},${barometer},${avgWindSpeed},${highWindSpeed},${dirWindSpeed},${rainfall},`;
    Logger.log(line);
    return { line, USData, metricData };
};
