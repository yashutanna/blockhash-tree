const events = require('./events');
class BlockNode {
    constructor(block) {
        this.block = block;
        this.parent = null;
        this.children = [];
    }

    setParent(parent){
        this.parent = parent;
    }
}

/**
 *  -> block -> block -> block -> block -> block -> block0  \-    -> block1 -> block2 -> block3 -> block4 -> block5
 *                                                           \-   -> block6 -> block7 -> block8 -> block9 -> block10 -> block11
 */

class BlockTree {
    /**
     * @type BlockTree[]
     */
    branches;
    /**
     * blockhash of the tip of the chain that we are following
     */
    tip;
    constructor(maxDepth = 10) {
        this.root = null;
        this.blocksByHash = {};
        this.maxDepth = maxDepth;
        this.branches = [];
        this.tip = null;
    }

    /**
     *
     * @param {BlockInfo} block
     * @param {ChainTip} activeChainTip
     */
    addBlock(block, activeChainTip) {
        const node = new BlockNode(block);
        if (this.root === null) { // this is the first block we are processing (this will be loaded from DB at come point)
            this.root = node;
            this.tip = block.hash;
            return;
        }

        const isDescendant = this.isDescendant(block); // we have processed this block's parent in the past
        if (isDescendant) {
            const parent = this.blocksByHash[block.previousBlockhash];
            parent.children.push(node);
            node.parent = parent;
            this.tip = block.hash;
            this.blocksByHash[block.hash] = node;
            // Prune if necessary.
            this.prune(activeChainTip);
        } else { // we have NOT processed this block's parent in the past - indicates fork or missing history
            this.addBlockToBranch(block);
        }
    }

    /**
     *
     * @param {BlockInfo} block
     */
    addBlockToBranch(block){
        const ancestralBranch = this.branches.find(branch => branch.isDescendant(block));
        if(ancestralBranch){
            ancestralBranch.addBlock(block)
        } else {
            const branch = new BlockTree(this.maxDepth);
            branch.addBlock(block);
            this.branches.push(branch);
        }
    }
    /**
     *
     * @param {BlockInfo} block
     * @return {boolean}
     */
    isDescendant(block) {
        return !!this.blocksByHash[block.previousBlockhash]
    }

    /**
     *
     * @param {ChainTip} activeChainTip
     */
    prune(activeChainTip) {
        let depth = 0;
        let node = this.root;

        // calculate depth of the tree
        while (node.children.length > 0) {
            node = node.children[0];
            depth += 1;
        }

        if(this.branches.length){ // ensure we are following the correct chain
            this.detectReOrgs(activeChainTip);
        } else { // only prune if we have no branches
            // prune the tree from the root side if the depth is larger than max depth
            if (depth > this.maxDepth) {
                this.root = this.root.children[0];
                this.root.parent = null;
            }
        }
    }

    /**
     * @param {ChainTip} activeChainTip
     */
    detectReOrgs(activeChainTip){
        if(this.tip === activeChainTip.hash){
            //do nothing if we are already following the active chain tip
            return;
        }
        const validBranchIndex = this.branches.findIndex(branch => branch.blocksByHash[activeChainTip.hash]);
        if(!validBranchIndex >= 0){
            this.resetToBlock(activeChainTip.hash, validBranchIndex)
            return;
        }
    }

    /**
     *  -> block0 -> block1 -> block2  ->   -> blockA3 -> blockA4 -> blockA5 -> blockA6 -> blockA7
     *                                  \-  -> blockB3 -> blockB4 -> blockB5 -> blockB6 -> blockB7 -> blockB8
     *
     * reset the block tree to a hash and emit the appropriate events
     *
     * given that our tree tip is blockA7 and activeBlockHash is blockB8
     *
     * @param {string} activeBlockHash
     * @param {number} branchIndex
     */
    resetToBlock(activeBlockHash, branchIndex){

    }

    /**
     *
     * @param {string} fromBlockHash
     * @param {string} toBlockHash
     */
    traverse(fromBlockHash, toBlockHash){

    }

    getReorgTxns(blockHash) {
        const node = this.blocksByHash[blockHash];
        if (!node) throw new Error(`Block not found for hash ${blockHash}`);
        return this._getTxns(node);
    }

    _getTxns(node) {
        let txns = [...node.block.txns];
        for (const child of node.children) {
            txns = [...txns, ...this._getTxns(child)];
        }
        return txns;
    }
}

module.exports = BlockTree;


/**
 * Represents information about a block in a blockchain.
 * @typedef {Object} BlockInfo
 * @property {string} hash - The hash of the block.
 * @property {number} strippedsize - The size of the block with witness data stripped.
 * @property {number} size - The size of the block.
 * @property {number} weight - The weight of the block.
 * @property {number} version - The version number of the block.
 * @property {string} versionHex - The hex representation of the version number.
 * @property {string} merkleroot - The Merkle root of the block.
 * @property {string[]} tx - The transactions included in the block.
 * @property {number} time - The timestamp of the block.
 * @property {number} nonce - The nonce value.
 * @property {string} bits - The bits value.
 * @property {string} previousBlockhash - The hash of the previous block.
 */
/**
 * Represents information about the tips of the chain
 * @typedef {Object} ChainTip
 * @property {number} height - height of the chain at this tip
 * @property {string} hash - blockHash at the tip of this chain
 * @property {number} branchlen - the length of the branch from this tip to the fork point (0 for active chain)
 * @property {"active"| "valid-fork"| "valid-headers"| "invalid"} status - status of this branch (active, valid-fork, valid-headers, invalid)
 */

