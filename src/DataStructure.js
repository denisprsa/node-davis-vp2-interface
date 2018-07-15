
module.exports = class DataStructure {
    constructor(date, temperature, dewPoint, humidity, barometer, avgWindSpeed, highWindSpeed, directionWind, rainfall) {
        this.date = date;
        this.temperature = temperature;
        this.dewPoint = dewPoint;
        this.humidity = humidity;
        this.barometer = barometer;
        this.avgWindSpeed = avgWindSpeed;
        this.highWindSpeed = highWindSpeed;
        this.directionWind = directionWind;
        this.rainfall = rainfall;
    }

    convertToLineString() {
        let day = this.date.getDate();
        let month = this.date.getMonth() + 1;
        let year = this.date.getFullYear();
        let hour = this.date.getHours();
        let minute = this.date.getMinutes();

        return `${day}.${month}.${year} ${hour}:${minute},${this.temperature},${this.dewPoint},${this.humidity},${this.barometer},${this.avgWindSpeed},${this.highWindSpeed},${this.directionWind},${this.rainfall},`;
    }

    convertToDatabaseObject() {
        return {
            timestamp: Math.floor(this.date.getTime() / 1000),
            tmp: Number(this.temperature),
            dewpoint: Number(this.dewPoint),
            hum: Number(this.humidity),
            awgwind: Number(this.avgWindSpeed),
            highwind: Number(this.highWindSpeed),
            winddir: Number(this.directionWind),
            baro: Number(this.barometer),
            rain: Number(this.rainfall)
        }
    }
}