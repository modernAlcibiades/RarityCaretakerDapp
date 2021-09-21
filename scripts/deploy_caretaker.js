// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

let tokens = [];
let deployer, caretaker;

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

  // Deploy Caretaker
  const Caretaker = await ethers.getContractFactory("RarityCaretaker");
  caretaker = await Caretaker.connect(deployer).deploy();
  await caretaker.deployed();

  console.log("Deployed at", caretaker.address);
  console.log("Owner", await caretaker.owner());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
