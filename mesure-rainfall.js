const fs = require("fs");

function main() {
    let data = fs.readFileSync("data.csv", "utf-8");
    let lines = data.trim().split("\n");
    let rainfall = 0;

    for (let line of lines) {
        let arrayOfDataInLine = line.split(",");
        rainfall += Number(arrayOfDataInLine[8]);
    }

    console.log(rainfall);
}

main();