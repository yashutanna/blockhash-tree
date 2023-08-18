const bitcoin = require('bitcoinjs-lib');
const bufferutils = require('bitcoinjs-lib/src/bufferutils');

function getBlockHeightFromRawData(rawBlockDataHex) {
    // Decode the raw block data from hexadecimal to bytes
    const decodedBlockData = Buffer.from(rawBlockDataHex, 'hex');

    // Extract the first 80 bytes (block header) from the decoded block data
    const blockHeader = decodedBlockData.slice(0, 80);

    // Get the block height (4-byte integer in little-endian format)
    return blockHeader.readUInt32LE(4);
}

function decodeRawBlock(hex) {
    const bitcoinBlock = bitcoin.Block.fromHex(hex);

    return {
        hash: bitcoinBlock.getId(),
        previousBlockhash: bufferutils.reverseBuffer(bitcoinBlock.prevHash).toString('hex'),
        merkleroot: bufferutils.reverseBuffer(bitcoinBlock.merkleRoot).toString('hex'),
        strippedsize: bitcoinBlock.byteLength(false, false),
        size: bitcoinBlock.byteLength(false, true),
        weight: bitcoinBlock.weight(),
        version: bitcoinBlock.version,
        versionHex: bitcoinBlock.version.toString(16),
        tx: bitcoinBlock.transactions ? bitcoinBlock.transactions.map(tx => tx.getHash().toString('hex')) : [],
        time: bitcoinBlock.getUTCDate().getTime(),
        nonce: bitcoinBlock.nonce,
        bits: bitcoinBlock.bits.toString(),
    }
}

module.exports = { decodeRawBlock }
