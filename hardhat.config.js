require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("./tasks/faucet");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.7",
  networks: {
    hardhat: {
      forking: {
        chainId: 250,
        url: "https://rpc.ftm.tools/",
        blockNumber: 17309300,
      }
    },
    fantom: {
      chainId: 250,
      url: "https://rpc.ftm.tools/",
      accounts: [process.env.PRIVATE_KEY],
      maxFeePerGas: 290000000000
    },
  },
  "evmVersion": "berlin",
  mocha: {
    timeout: 200000
  }
};
