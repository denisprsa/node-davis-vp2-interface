
/**
 * Returns last date rounded by 5 minutes
 *
 * @param {Date} lastDate 
 */
module.exports = (lastDate) => {
    let minutes = lastDate.getMinutes();
    let addMinutes = 0;

    while (minutes % 2 !== 0) {
        minutes -= 1;
        addMinutes -= 1;
    }

    lastDate.setMinutes(lastDate.getMinutes() - addMinutes);
    lastDate.setSeconds(0);
    lastDate.setMilliseconds(0);

    return lastDate;
};
