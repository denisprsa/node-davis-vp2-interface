
module.exports = (data) => {
    let crc = new Uint16Array([0x0000])

    for (let d of data) {
        let leftCrc = new Uint16Array([crc[0] >> 8])
        let rightCrc = new Uint16Array([crc[0] << 8])

        let crcTIdx = leftCrc[0] ^ d;
        let crcT = this.crc_table[crcTIdx];

        crc[0] = crcT ^ rightCrc[0];
    }

    return new Buffer(new Uint8Array(crc.buffer)).reverse();
};
