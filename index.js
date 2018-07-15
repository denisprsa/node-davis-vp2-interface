
const WeatherStation = require('./src/WeatherStation');
const config = require('./config/config.json');
const weatherStation = new WeatherStation(config);
const Logger = require('./src/Logger');
const SaveDataToFile = require('./src/helpers/save-data-to-file');
const LastDateForArchive = require('./src/helpers/get-rounded-date-for-archive');

async function main() {
    await weatherStation.wakeUpStation();
    let lastDate = weatherStation.getLastDateFromArchive(config);
    lastDate = LastDateForArchive(lastDate);
    Logger.log('Last date: ' + lastDate.toLocaleString())
    let archiveData = await weatherStation.readFromArchive(lastDate);
    SaveDataToFile(archiveData, config.fileDBLocation);
    await weatherStation.startLiveReading(config);
    await weatherStation.close();
}

main()
    .then(async ()=> {
        Logger.log('Closing connection to weather station.');
        await weatherStation.close();
        Logger.log('Exiting.');
    })
    .catch(async err => {
        Logger.log('Closing connection to weather station.');
        await weatherStation.close();

        Logger.log('Error throw.');
        Logger.error(err);

        process.exit(1);
    });

// Catch and log unexpected rejections
process.on('unhandledRejection', async (reason, p) => {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    Logger.log('Closing connection to weather station.');
    await weatherStation.close();

    process.exit(1);
});