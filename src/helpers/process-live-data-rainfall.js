
module.exports = (currentDate, currentRainfall, config) => {
    let data = fs.readFileSync(config.fileDBLocation, 'utf-8');
    var lines = data.trim().split('\n');
    
    var lastLines = lines.slice(-20);
    
    console.log(lastLines);
    /*
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
    */
};
