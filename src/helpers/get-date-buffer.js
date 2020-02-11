const Concatenate = require("./concatenate");

module.exports = (date) => {
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours();
    let minute = date.getMinutes();

    let vantageDateStamp = new Uint16Array([day + month*32 + (year-2000)*512]);
    let vantageTimeStamp = new Uint16Array([100*hour + minute]);
    let vantageDateStampUint8 = new Uint8Array(vantageDateStamp.buffer);
    let vantageTimeStampUint8 = new Uint8Array(vantageTimeStamp.buffer);

    return Concatenate(Uint8Array, vantageDateStampUint8, vantageTimeStampUint8);
};
