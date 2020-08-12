
module.exports = (currentDate, currentRainfall, data = []) => {
    currentDate.setMinutes(currentDate.getMinutes() - 60);
    let sumRain = 0;

    for (let line of data) {
        if (currentDate <= line.date) {
            let rain = line.rainfall;
            sumRain += Number(rain);
        }
    }

    return currentRainfall - sumRain;
};
