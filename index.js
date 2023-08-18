const Emitter = require('./src/subscription');
const Tree = require('./src/tree');

const tree = new Tree();
const emitter = new Emitter(tree);

emitter.start().catch(err => {
    console.error(err)
});
