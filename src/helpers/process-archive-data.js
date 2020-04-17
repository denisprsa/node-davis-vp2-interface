const Logger = require("../Logger");

function getUint16(number) {
    return new Uint16Array([number])[0];
}

module.exports = (data, startDate, row) => {
    let startIdx = 1;
    let arr = [];
    let count = 0;

    while (startIdx < 260) {
        if (count >= row || row === undefined) {
            let metricData = {};
            let dateNumber = data.readInt16LE(startIdx);

            // Date
            let year = dateNumber >> 9;
            year = year + 2000;
            let month = dateNumber << 7;
            month = getUint16(month) >> 12;
            let day = dateNumber << 11;
            day = getUint16(day) >> 11;

            // Time
            let timeNumber = data.readInt16LE(startIdx + 2);
            let hour = Math.floor(timeNumber / 100);
            let minute = timeNumber - (100 * hour);

            // Temperature
            let temperature = data.readInt16LE(startIdx + 4);
            temperature = ((temperature / 10) - 32) / 1.8;
            temperature = temperature.toFixed(1);
            metricData.temperature = temperature;

            // Rainfall
            let rainfall = data.readInt16LE(startIdx + 10);
            rainfall = rainfall * 0.2;
            metricData.rainfall = rainfall;

            // Barometer
            let barometer = data.readInt16LE(startIdx + 14);
            barometer = (barometer / 1000) * 33.863753;
            barometer = barometer.toFixed(1);
            metricData.barometer = barometer;

            // Humidity
            let humidity = data.readUInt8(startIdx + 23);
            metricData.humidity = humidity;

            // Avg wind speed
            let avgWindSpeed = data.readUInt8(startIdx + 24);
            avgWindSpeed =  avgWindSpeed / 2;
            avgWindSpeed = avgWindSpeed * 1.60934;
            avgWindSpeed = avgWindSpeed.toFixed(1);
            metricData.avgWindSpeed = avgWindSpeed;

            // High wind speed
            let highWindSpeed = data.readUInt8(startIdx + 25);
            highWindSpeed = highWindSpeed / 2;
            highWindSpeed = highWindSpeed * 1.60934;
            highWindSpeed = highWindSpeed.toFixed(1);
            metricData.highWindSpeed = highWindSpeed;

            // Direction wind speed
            let dirWindSpeed = data.readUInt8(startIdx + 27);
            dirWindSpeed = dirWindSpeed * 22.5;
            metricData.dirWindSpeed = dirWindSpeed;

            // Dew point
            let dewPoint = temperature - ((100 - humidity)/5);
            dewPoint = dewPoint.toFixed(1);
            metricData.dewPoint = dewPoint;

            let line = `${day}.${month}.${year} ${hour}:${minute},${temperature},${dewPoint},${humidity},${barometer},${avgWindSpeed},${highWindSpeed},${dirWindSpeed},${rainfall},`;
            Logger.log(line);

            let dataDate = new Date();
            dataDate.setFullYear(year);
            dataDate.setMonth(month - 1);
            dataDate.setDate(day);
            dataDate.setHours(hour);
            dataDate.setMinutes(minute);
            dataDate.setSeconds(0);
            dataDate.setMilliseconds(0);
            metricData.date = dataDate;


            if (startDate <= dataDate) {
                arr.push({
                    line,
                    metricData,
                    USData: {} // we don't need this for now
                });
            } else {
                break;
            } 
        }

        count += 1;
        startIdx += 52;
    }

    return arr;
};
