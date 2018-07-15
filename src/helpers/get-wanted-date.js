
module.exports = () => {
    let wantedDate = new Date();
    let minutes = wantedDate.getMinutes();
    let addMinutes = 1;

    // Same minute cannot appear because this time is then in past
    minutes += 1;

    while (minutes % 2 !== 0) {
        minutes += 1;
        addMinutes += 1;
    }

    wantedDate.setMinutes(wantedDate.getMinutes() + addMinutes);
    wantedDate.setSeconds(0);
    wantedDate.setMilliseconds(0);

    return wantedDate;
};
