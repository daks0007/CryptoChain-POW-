const Transaction = require("../wallet/transaction");
const TransactionPool = require("../wallet/transaction-pool");

class TransactionMiner {
  constructor({ blockchain, transactionPool, wallet, pubsub }) {
    this.blockchain = blockchain;
    this.transactionPool = transactionPool;
    this.wallet = wallet;
    this.pubsub = pubsub;
  }
  mineTransaction() {
    const validTransactions = this.transactionPool.validTransactions(); //get the valid transactions form the TransactionPool

    validTransactions.push(
      Transaction.rewardTransaction({ minerWallet: this.wallet }) //generate the miner's reward
    );

    this.blockchain.addBlock({ data: validTransactions }); //add a block consisting of these transaction to the blockchain

    this.pubsub.broadcastChain(); //broadcast the updated blockchain
    this.transactionPool.clear(); //clear the transacion pool
  }
}

module.exports = TransactionMiner;
