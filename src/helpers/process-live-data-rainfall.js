
module.exports = (currentDate, currentRainfall, data = []) => {
    currentDate.setMinutes(currentDate.getMinutes() - 60);
    let sumRain = 0;

    console.log('process live data rainfall');
    console.log(data);

    for (let line of data) {
        if (currentDate <= line.date) {
            let rain = line.rainfall;
            sumRain += Number(rain);
        }
    }

    console.log(sumRain);
    console.log(currentRainfall);
    console.log(currentRainfall - sumRain);
    console.log('====  end ====');

    return currentRainfall - sumRain;
};
