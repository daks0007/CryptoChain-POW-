const Transaction = require("./transaction");
const Wallet = require("./index");
const { verifySignature } = require("../utils");
const { REWARD_INPUT, MINING_REWARD } = require("../config");
describe("Transaction", () => {
  let transaction, senderWallet, recipient, amount;
  beforeEach(() => {
    //Only wallets should be able to send transaction
    senderWallet = new Wallet();

    recipient = "recipient-public-key";
    amount = 100;

    transaction = new Transaction({ senderWallet, recipient, amount });
  });
  //every transaction should have an id
  it("has an `id`", () => {
    expect(transaction).toHaveProperty("id");
  });
  //outputMap fuction is similar to mapping in solidity
  describe("outputMap", () => {
    it("has an `outputMap`", () => {
      expect(transaction).toHaveProperty("outputMap");
    });

    it("outputs the amount to the recipient", () => {
      expect(transaction.outputMap[recipient]).toEqual(amount);
    });
    it("outputs the remaining balance of the senderWallet", () => {
      expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
        senderWallet.balance - amount
      );
    });
  });
  describe("input", () => {
    it("has an `input`", () => {
      expect(transaction).toHaveProperty("input");
    });
    it("has a `timestamp` in the input", () => {
      expect(transaction.input).toHaveProperty("timestamp");
    });
    it("sets the `amount` in the `senderWallet` balance", () => {
      expect(transaction.input.amount).toEqual(senderWallet.balance);
    });
    it("sets the `address` to the `senderWallet` publicKey", () => {
      expect(transaction.input.address).toEqual(senderWallet.publicKey);
    });
    it("signs the `input`", () => {
      expect(
        verifySignature({
          publicKey: senderWallet.publicKey,
          data: transaction.outputMap,
          signature: transaction.input.signature,
        })
      ).toBe(true);
    });
  });
  describe("validTransaction()", () => {
    describe("when the transaction is valid", () => {
      it("returns true", () => {
        expect(Transaction.validTransaction(transaction)).toBe(true);
      });
    });
    describe("when the transaction is invalid", () => {
      let errormock;
      beforeEach(() => {
        errormock = jest.fn();

        global.console.error = errormock;
      });
      describe("and a transaction outputMap value is invalid", () => {
        it("should return false and logs an error", () => {
          transaction.outputMap[senderWallet.publicKey] = 999999;
          expect(Transaction.validTransaction(transaction)).toBe(false);
          expect(errormock).toHaveBeenCalled();
        });
      });
      describe("and the trasaction input signature is faked", () => {
        it("should return false and logs an error", () => {
          transaction.input.signature = new Wallet().sign("data");
          expect(Transaction.validTransaction(transaction)).toBe(false);
          expect(errormock).toHaveBeenCalled();
        });
      });
    });
  });
  describe("update()", () => {
    let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

    describe("and the amount is NOT valid", () => {
      it("throws an error", () => {
        expect(() => {
          transaction.update({
            senderWallet,
            recipient: "daks",
            amount: 999999,
          });
        }).toThrow("Amount exceeds balance");
      });
    });

    describe("and the amount is valid", () => {
      beforeEach(() => {
        originalSignature = transaction.input.signature;
        originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
        nextRecipient = "next-recipient";
        nextAmount = 100;

        transaction.update({
          senderWallet,
          recipient: nextRecipient,
          amount: nextAmount,
        });
      });
      it("outputs the amount to the next recipient", () => {
        expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
      });
      it("substracts the amount from the original sender output amount", () => {
        expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
          originalSenderOutput - nextAmount
        );
      });
      it("maintains a total output that matches the input amount", () => {
        expect(
          Object.values(transaction.outputMap).reduce(
            (total, outputAmount) => total + outputAmount
          )
        ).toEqual(transaction.input.amount);
      });
      it("re-signs the transaction", () => {
        expect(transaction.input.signature).not.toEqual(originalSignature);
      });
      describe("and another update for the same recipient", () => {
        let addedAmount;
        beforeEach(() => {
          addedAmount = 50;
          transaction.update({
            senderWallet,
            recipient: nextRecipient, //same recipient from before
            amount: addedAmount,
          });
        });
        it("adds to the recipient amount", () => {
          expect(transaction.outputMap[nextRecipient]).toEqual(
            nextAmount + addedAmount
          );
        });
        it("should substract the amount from the original sender output amount", () => {
          expect(transaction.outputMap[senderWallet.publicKey]).toEqual(
            originalSenderOutput - nextAmount - addedAmount
          );
        });
      });
    });
  }); //update function will have the ability to add a transaction to a recipient in an existing transaction outputMap
  describe("rewardTransaction()", () => {
    let rewardTransaction, minerWallet;
    beforeEach(() => {
      minerWallet = new Wallet();
      rewardTransaction = Transaction.rewardTransaction({ minerWallet });
    });
    it("creates a transaction with the reward input", () => {
      expect(rewardTransaction.input).toEqual(REWARD_INPUT);
    });
    it("creates ones transaction for the miner for the `MINER_REWARD`", () => {
      expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(
        MINING_REWARD
      );
    });
  });
});
