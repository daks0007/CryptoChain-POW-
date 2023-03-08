const MINED_RATE = 2000;

const INITIAL_DIFFICULTY = 9;

const GENESIS_DATA = {
  timestamp: 1,
  lastHash: "----",
  hash: "hash-one",
  difficulty: INITIAL_DIFFICULTY,
  nonce: 0,
  data: [],
};
const REWARD_INPUT = { address: "*authorized_rewward*" };
const MINING_REWARD = 25;
const STARTING_BALANCE = 1000;
module.exports = {
  GENESIS_DATA,
  MINED_RATE,
  STARTING_BALANCE,
  REWARD_INPUT,
  MINING_REWARD,
};
