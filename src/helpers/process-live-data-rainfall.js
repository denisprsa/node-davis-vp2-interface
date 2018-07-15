const fs = require('fs');

module.exports = (currentDate, currentRainfall, config) => {
    currentDate.setMinutes(currentDate.getMinutes() - 15); 
    let data = fs.readFileSync(config.fileDBLocation, 'utf-8');
    let lines = data.trim().split('\n');
    let sumRain = 0;
    let lastLines = lines.slice(-20);

    for (line of lastLines) {

        let arrayOfDataInLine = line.split(',');
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

        if (currentDate <= lastDate) {
            rain = arrayOfDataInLine[arrayOfDataInLine.length - 2]
            sumRain += Number(rain);
        }
    }

    return sumRain - currentRainfall;
};