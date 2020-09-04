
const WeatherStation = require("./src/WeatherStation");
const config = require("./config/config.json");
const weatherStation = new WeatherStation(config);
const Logger = require("./src/Logger");
const { MongoDB } = require("./src/helpers/database");
const LastDateForArchive = require("./src/helpers/get-rounded-date-for-archive");
const UpdateTime = require("./src/helpers/update-time");

async function main() {
    try {
        await UpdateTime();
    } catch (e) {
        Logger.error(e);
    }

    const mongoDB = new MongoDB();

    await mongoDB.initialize(config);
    await weatherStation.wakeUpStation();

    const lastDateFromDB = await mongoDB.getLastArchiveTime(config);
    let formattedLastDate = "";
    
    if (lastDateFromDB) {
        formattedLastDate = LastDateForArchive(lastDateFromDB);
    } else {
        let olderDate = new Date();
        olderDate.setDate(olderDate.getDate() - 14);
        formattedLastDate = LastDateForArchive(olderDate);
    }

    Logger.log("Last date: " + formattedLastDate.toLocaleString());

    let archiveData = await weatherStation.readFromArchive(formattedLastDate);
    await mongoDB.saveDataToArchive(archiveData);

    await weatherStation.startLiveReading(config, mongoDB);
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