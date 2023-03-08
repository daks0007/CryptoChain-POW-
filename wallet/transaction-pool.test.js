const TransactionPool = require("./transaction-pool");

const Transaction = require("./transaction");
const Blockchain = require("../blockchain");

const Wallet = require("./index");
const { intFromLE } = require("elliptic/lib/elliptic/utils");

describe("Transaction", () => {
  let transactionPool, transaction, senderWallet;

  beforeEach(() => {
    senderWallet = new Wallet();
    transactionPool = new TransactionPool();
    transaction = new Transaction({
      senderWallet,
      recipient: "fake-recipient",
      amount: 100,
    });
  });
  describe("setTransaction()", () => {
    it("adds a transaction", () => {
      transactionPool.setTransaction(transaction);
      expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
    });
  });
  describe("existingTransaction()", () => {
    it("returns an existing transaction given an input address", () => {
      transactionPool.setTransaction(transaction);
      expect(
        transactionPool.existingTransaction({
          inputAddress: senderWallet.publicKey,
        })
      ).toBe(transaction);
    });
  });
  describe("validTransactions()", () => {
    let validTransactions, errorMock;

    beforeEach(() => {
      validTransactions = [];
      errorMock = jest.fn();
      global.console.error = errorMock;

      for (let i = 0; i < 10; i++) {
        transaction = new Transaction({
          senderWallet,
          recipient: "any-recipient",
          amount: 30,
        });

        if (i % 3 === 0) {
          transaction.input.amount = 999999;
        } else if (i % 3 === 1) {
          transaction.input.signature = new Wallet().sign("foo");
        } else {
          validTransactions.push(transaction);
        }

        transactionPool.setTransaction(transaction);
      }
    });

    it("returns valid transaction", () => {
      expect(transactionPool.validTransactions()).toEqual(validTransactions);
    });
    it("logs error for the invalid transaction", () => {
      transactionPool.validTransactions();
      expect(errorMock).toHaveBeenCalled();
    });
  });
  describe("clear()", () => {
    it("clears the transaction pool", () => {
      transactionPool.clear();
      expect(transactionPool.transactionMap).toEqual({});
    });
  });
  describe("clearBlockchainTransactions()", () => {
    it("clears the pool of any existing blockchain transaction", () => {
      const blockchain = new Blockchain();
      let expectedTransactionMap = {};
      for (let i = 0; i < 6; i++) {
        const transaction = new Transaction({
          senderWallet,
          recipient: "DAKS",
          amount: 40,
        });
        transactionPool.setTransaction(transaction);
        if (i % 2 === 0) {
          blockchain.addBlock({ data: [transaction] });
        } else {
          expectedTransactionMap[transaction.id] = transaction;
        }
      }
      transactionPool.clearBlockchainTransactions({ chain: blockchain.chain });
      expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
    });
  });
});
