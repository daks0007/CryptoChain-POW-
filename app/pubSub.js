const { json } = require("express/lib/response");
const redis = require("redis");
const CHANNELS = {
  TEST: "TEST",
  BLOCKCHAIN: "BLOCKCHAIN", //WHEN A  NEW BLOCK IS ADDED TO THE CHAIN IT IS THE DUTY OF THE MINER TO PUBLISH THE BLOCK ON THIS NETWORK
  TRANSACTION: "TRANSACTION",
};
class pubSub {
  constructor({ blockchain, transactionPool }) {
    this.blockchain = blockchain; //now every pusub instance will have a local blockchain in it
    this.transactionPool = transactionPool;
    this.publisher = redis.createClient();
    this.subscriber = redis.createClient();

    this.subscribeToChannels();

    this.subscriber.on("message", (channel, message) => {
      this.handleMessage(channel, message);
    });
  }
  //we will use this handle message function to add the blocks to the blockchain that are published by the user
  handleMessage(channel, message) {
    console.log(`message received ${channel}. Message:${message}`);
    const parsedMessage = JSON.parse(message); //to get the orginal non stringify value of the message
    //first we will check if the messgage is to the blockchain channel
    switch (channel) {
      case CHANNELS.BLOCKCHAIN:
        this.blockchain.replaceChain(parsedMessage, true, () => {
          this.transactionPool.clearBlockchainTransaction({
            chain: parsedMessage,
          });
        });
        break;
      case CHANNELS.TRANSACTION:
        this.transactionPool.setTransaction(parsedMessage);
        break;
      default:
        return;
    }
  }
  subscribeToChannels() {
    Object.values(CHANNELS).forEach((channel) => {
      this.subscriber.subscribe(channel);
    });
  }
  publish({ channel, message }) {
    this.subscriber.unsubscribe(channel, () => {
      this.publisher.publish(channel, message, () => {
        this.subscriber.subscribe(channel);
      });
    });
  }
  //to broadcast(publish) the blockchain instance to every subscriber
  broadcastChain() {
    this.publish({
      channel: CHANNELS.BLOCKCHAIN,
      message: JSON.stringify(this.blockchain.chain), //as this is an array and we can only publish string messages we will use json.stringify
    });
  }
  broadcastTransaction(transaction) {
    this.publish({
      channel: CHANNELS.TRANSACTION,
      message: JSON.stringify(transaction),
    });
  }
}

module.exports = pubSub;
