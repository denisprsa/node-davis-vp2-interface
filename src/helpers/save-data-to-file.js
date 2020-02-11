const fs = require("fs");

module.exports = (data, filename) => {
    let dataToSave = "";

    for (let d of data) {
        dataToSave += d.data + "\n";
    }

    fs.appendFileSync(filename, dataToSave);
};
