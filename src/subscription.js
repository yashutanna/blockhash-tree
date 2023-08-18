const { createSocket } = require('zeromq');
const { decodeRawBlock } = require("./block");

class Emitter {
    queueProducer
    nodeSocket;
    /**
     * @type {BlockTree}
     */
    tree;

    constructor(tree) {
        this.tree = tree;
    }

    reverseBuffer(buffer) {
        if (buffer.length < 1) return buffer;
        let j = buffer.length - 1;
        let tmp = 0;
        for (let i = 0; i < buffer.length / 2; i++) {
            tmp = buffer[i];
            buffer[i] = buffer[j];
            buffer[j] = tmp;
            j--;
        }
        return buffer;
    }

    setupNodeSocket() {
        const zmqSubscriptionAddress = 'tcp://127.0.0.1:22222';

        console.log(`setting up zeroMQ socket on address[ZMQ_URL=${zmqSubscriptionAddress}]`);
        //setup socket to listen to hashblock zeroMQ messages
        const nodeSocket = createSocket('sub');
        nodeSocket.connect(zmqSubscriptionAddress);
        nodeSocket.subscribe('rawblock');
        console.log('subscribing to zeroMQ topic(rawblock)');
        nodeSocket.on('message', (topic, message) => {
            console.log('received new message from the zmq subscription');
            const block = decodeRawBlock(message.toString('hex'));
            this.tree.addBlock(block);
        });
        return nodeSocket;
    }

    async start() {
        this.nodeSocket = this.setupNodeSocket();
        console.log(`Emitter started`)
    }

    async stop() {
        if(this.nodeSocket){
            this.nodeSocket.close();
            this.nodeSocket = null;
        }
        if(this.queueProducer){
            await this.queueProducer.terminate();
            this.queueProducer = null;
        }
    }
}

module.exports = Emitter;
