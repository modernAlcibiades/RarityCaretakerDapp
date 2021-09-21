// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const { tokens } = require("../config.js");
console.log(tokens);
let deployer;
let rarity, rarity_attributes, caretaker;
const SLEEPMS = 1000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function approval(id, addr) {
  const approved = await rarity.getApproved(id);
  console.log("Approved", id, approved);
  if (approved != addr) {
    const txn = await rarity.connect(deployer).approve(addr, id);
    const receipt = txn.wait();
    const approved = await rarity.getApproved(id);
    await sleep(SLEEPMS);
    console.log("Approved", id, approved);
  }
}

async function main() {
  // Get account
  if (network.name == 'hardhat') {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [process.env.ADDRESS],
    });
    deployer = await ethers.getSigner(process.env.ADDRESS)
  } else if (network.name == 'fantom') {
    deployer = (await ethers.getSigners())[0];
  }
  console.log("Deployer", deployer.address);

  const Rarity = await ethers.getContractFactory("rarity");
  rarity = Rarity.attach("0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb");

  const Caretaker = await ethers.getContractFactory("RarityCaretaker");
  caretaker = await Caretaker.attach(process.env.CONTRACT_ADDRESS);
  console.log(caretaker.address);

  // Initial value for all characters
  for (let i = 0; i < tokens.length; i++) {
    // Approve tokens if not approved
    try {
      await approval(tokens[i], `${caretaker.address}`);
    } catch (e) {
      console.log(e)
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
