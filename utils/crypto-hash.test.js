const cryptoHash = require("./crypto-Hash");

describe("crptoHash()", () => {
  it("generates a SHA-256 hashed output", () => {
    expect(cryptoHash("Daks")).toEqual(
      "51f52ceab84ec5b6934f2881776c96972af04a67bf10db7d6f85778c5e8959b7"
    );
  });
  it("produces the same hash with the same argumenst in any order", () => {
    expect(cryptoHash("one", "two", "three")).toEqual(
      cryptoHash("three", "two", "one")
    );
  });
  it("produces a unique hash when the properties have changed on an input", () => {
    const daks = {};
    const originalHash = cryptoHash(daks);
    daks["a"] = "a";
    expect(cryptoHash(daks)).not.toEqual(originalHash);
  });
});
