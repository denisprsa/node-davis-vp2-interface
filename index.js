
const WeatherStation = require('./src/WeatherStation');
const weatherStation = new WeatherStation();

async function main() {
    await weatherStation.wakeUpStation();
    let lastDate = weatherStation.getLastDateFromArchive();
    let archiveData = await weatherStation.readFromArchive(lastDate);
    weatherStation.saveDataToFile(archiveData);
    await weatherStation.startLiveReading();
    await weatherStation.close();
}

main()
    .then(()=> {})
    .catch(async err => {
        await weatherStation.close();
        console.log(err);
        process.exitCode = 1;
        process.exit();
    });