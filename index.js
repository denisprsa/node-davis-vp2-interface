
const WeatherStation = require("./src/WeatherStation");
const config = require("./config/config.json");
const weatherStation = new WeatherStation(config);
const Logger = require("./src/Logger");
const { saveDataToArchive, getLastArchiveTime } = require("./src/helpers/database");
const LastDateForArchive = require("./src/helpers/get-rounded-date-for-archive");
const UpdateTime = require("./src/helpers/update-time");

async function main() {
    await UpdateTime();
    await weatherStation.wakeUpStation();

    let lastDate = getLastArchiveTime(config);
    lastDate = LastDateForArchive(lastDate);

    Logger.log("Last date: " + lastDate.toLocaleString());

    let archiveData = await weatherStation.readFromArchive(lastDate);
    saveDataToArchive(archiveData, config);

    await weatherStation.startLiveReading(config);
    await weatherStation.close();
}

main()
    .then(async ()=> {
        Logger.log("Closing connection to weather station.");
        await weatherStation.close();
        Logger.log("Exiting.");
    })
    .catch(async err => {
        Logger.log("Closing connection to weather station.");
        await weatherStation.close();

        Logger.log("Error throw.");
        Logger.error(err);

        process.exit(1);
    });

// Catch and log unexpected rejections
process.on("unhandledRejection", async (reason, p) => {
    console.log("Possibly Unhandled Rejection at: Promise ", p, " reason: ", reason);
    Logger.log("Closing connection to weather station.");
    await weatherStation.close();

    process.exit(1);
});