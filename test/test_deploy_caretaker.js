const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Caretaker", function () {
  it("Deploy and test caretaker contract", async function () {
    // Load account
    let deployer;
    if (network.name == 'hardhat') {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [process.env.ADDRESS],
      });
      deployer = await ethers.getSigner(process.env.ADDRESS)
    } else if (network.name == 'fantom') {
      deployer = (await ethers.getSigners())[0];
    }

    const Caretaker = await ethers.getContractFactory("RarityCaretaker");
    const caretaker = await Caretaker.connect(deployer).deploy();
    await caretaker.deployed();

    console.log("Deployed at", caretaker.address);
    console.log("Owner", await caretaker.owner());
    expect(await caretaker.owner()).to.equal(deployer.address);

    const master = await caretaker.master();
    console.log(master);
    expect(master).to.equal("0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb");
  });
});
