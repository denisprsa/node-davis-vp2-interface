
module.exports = (data, startDate, row) => {
    let startIdx = 1;
    let arr = []
    let count = 0;

    while (startIdx < 260) {
        if (count >= row || row === undefined) {
            let dateNumber = data.readInt16LE(startIdx)

            // Date
            let year = dateNumber >> 9;
            year = year + 2000;
            let month = dateNumber << 7;
            month = this.getUint16(month) >> 12;
            let day = dateNumber << 11;
            day = this.getUint16(day) >> 11;

            // Time
            let timeNumber = data.readInt16LE(startIdx + 2);
            let hour = Math.floor(timeNumber / 100);
            let minute = timeNumber - (100 * hour);

            // Temperature
            let temperature = data.readInt16LE(startIdx + 4);
            temperature = ((temperature / 10) - 32) / 1.8;
            temperature = temperature.toFixed(1);

            // Rainfall
            let rainfall = data.readInt16LE(startIdx + 10);
            rainfall = rainfall * 0.2;

            // Barometer
            let barometer = data.readInt16LE(startIdx + 14);
            barometer = (barometer / 1000) * 33.863753
            barometer = barometer.toFixed(1);

            // Humidity
            let humidity = data.readUInt8(startIdx + 23);

            // Avg wind speed
            let avgWindSpeed = data.readUInt8(startIdx + 24);
            avgWindSpeed = avgWindSpeed * 1.60934;
            avgWindSpeed = avgWindSpeed.toFixed(1);

            // High wind speed
            let highWindSpeed = data.readUInt8(startIdx + 25);
            highWindSpeed = highWindSpeed * 1.60934;
            highWindSpeed = highWindSpeed.toFixed(1);

            // Direction wind speed
            let dirWindSpeed = data.readUInt8(startIdx + 27);

            // Dew point
            let dewPoint = temperature - ((100 - humidity)/5);
            dewPoint = dewPoint.toFixed(1);

            let line = `${day}.${month}.${year} ${hour}:${minute},${temperature},${dewPoint},${humidity},${barometer},${avgWindSpeed},${highWindSpeed},${dirWindSpeed},${rainfall},`
            Logger.log(line);

            let dataDate = new Date();
            dataDate.setFullYear(year);
            dataDate.setMonth(month - 1);
            dataDate.setDate(day);
            dataDate.setHours(hour);
            dataDate.setMinutes(minute);
            dataDate.setSeconds(0);
            dataDate.setMilliseconds(0);


            if (startDate <= dataDate) {
                arr.push({
                    data: line,
                    date: dataDate
                })
            } else {
                break;
            } 
        }

        count += 1;
        startIdx += 52;
    }

    return arr;
};
