const express = require("express");
const request = require("request");
const PubSub = require("./app/pubSub");
const bodyParser = require("body-parser");
const res = require("express/lib/response");
const Blockchain = require("./blockchain");
const req = require("express/lib/request");
const { is } = require("express/lib/request");
const TransactionPool = require("./wallet/transaction-pool");
const Wallet = require("./wallet");
const { json } = require("express/lib/response");
const TransactionMiner = require("./app/transaction-miner");
const path = require("path");
//express module is a function containing objects
//so we can call the function and save it to a variable app

const app = express();
const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool });
const transactionMiner = new TransactionMiner({
  blockchain,
  transactionPool,
  wallet,
  pubsub,
});
const DEFAULT_PORT = 3000;

const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client/dist")));

//get request that allows the node to get all the block in the
//Blockchain
// setTimeout(() => pubsub.broadcastChain(), 1000);
app.get("/api/blocks", (req, res) => {
  res.json(blockchain.chain); //this will send the blockchain.chain in a json form to the requester
}); //get HTTP request--it is used to read data from the backend

//POST method to mine a block on the blockchain
//this post method is going to receive data from the user in a json format
//within the request the user will define a json body field that includes the new data of the block add  to the chain
app.post("/api/mine", (req, res) => {
  const { data } = req.body;
  blockchain.addBlock({ data });
  //to broadcast the channel whenever a new block is added to the api/mine by a node(publisher)
  pubsub.broadcastChain();

  //to show to the user that there request was successful we will redirect them to the api/blocks
  //so that they can see that there new block was added to the chain

  res.redirect("/api/blocks");
});

app.post("/api/transact", (req, res) => {
  const { amount, recipient } = req.body;

  let transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey,
  });

  try {
    if (transaction) {
      transaction.update({ senderWallet: wallet, recipient, amount });
    } else {
      transaction = wallet.createTransaction({
        recipient,
        amount,
        chain: blockchain.chain,
      });
    }
  } catch (error) {
    return res.status(400).json({ type: "error", message: error.message });
  }
  transactionPool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);

  res.json({ type: "success", transaction });
});

app.get("/api/transaction-pool-map", (req, res) => {
  res.json(transactionPool.transactionMap);
});

app.get("/api/mine-transaction", (req, res) => {
  transactionMiner.mineTransaction();
  res.redirect("/api/blocks");
});
app.get("/api/wallet-info", (req, res) => {
  res.json({
    address: wallet.publicKey,
    balance: Wallet.calculateBalance({
      chain: blockchain.chain,
      address: wallet.publicKey,
    }),
  });
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/dist/index.html"));
});

//syncchain function is used to sync the chain to the new node as soon as they join
const SyncChainWithRootState = () => {
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/blocks` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootChain = JSON.parse(body);
        console.log(`replace chain in sync with`, rootChain);
        blockchain.replaceChain(rootChain);
      }
    }
  );
  request(
    { url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map` },
    (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const rootTransactionPoolMap = JSON.parse(body);

        console.log(
          "replace transaction pool map in sync with",
          rootTransactionPoolMap
        );
        transactionPool.setMap(rootTransactionPoolMap);
      }
    }
  );
};
const walletEshan = new Wallet();
const walletDaks = new Wallet();

const generateWalletTransaction = ({ wallet, recipient, amount }) => {
  const transaction = wallet.createTransaction({
    recipient,
    amount,
    chain: blockchain.chain,
  });
  transactionPool.setTransaction(transaction);
};
const walletAction = () =>
  generateWalletTransaction({
    wallet,
    recipient: walletDaks.publicKey,
    amount: 102,
  });
const walletDaksAction = () =>
  generateWalletTransaction({
    wallet: walletDaks,
    recipient: walletEshan.publicKey,
    amount: 23,
  });
const walletEshanAction = () =>
  generateWalletTransaction({
    wallet: walletEshan,
    recipient: wallet.publicKey,
    amount: 35,
  });
for (let i = 0; i < 10; i++) {
  if (i % 3 === 0) {
    walletAction();
    walletDaksAction();
  } else if (i % 3 === 1) {
    walletAction();
    walletEshanAction();
  } else {
    walletDaksAction();
    walletEshanAction();
  }
  transactionMiner.mineTransaction();
}

//finally we need to make sure that this express application starts
//so we use the listen function on the app object
let PEER_PORT;

if (process.env.GENERATE_PEER_PORT === "true") {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}
const PORT = PEER_PORT || DEFAULT_PORT;
//port no.--1 parameter 3000 being the default port for developement
app.listen(PORT, () => {
  console.log(`listening at localhost:${PORT}`);
  if (PORT !== DEFAULT_PORT) {
    SyncChainWithRootState();
  }
});
