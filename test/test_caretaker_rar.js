const { expect } = require("chai");
const { ethers } = require("hardhat");

let deployer;
let rarity, rarity_attributes, rarity_crafting, caretaker, base, rar;
const { tokens } = require("../config.js");
console.log(tokens);
const attrs = [
  [16, 12, 14, 12, 12, 12], //barbarian, 
  [12, 12, 14, 12, 12, 16], //bard
  [12, 12, 14, 16, 12, 12], //cleric
  [16, 16, 11, 11, 11, 11]] //random

async function approval(id, addr) {
  const approved = await rarity.getApproved(id);
  console.log("Approved", id, approved);
  if (approved != addr) {
    const txn = await rarity.connect(deployer).approve(caretaker.address, id);
    const receipt = txn.wait();
    const approved = await rarity.getApproved(id);
    console.log("Approved", id, approved);
    console.log("Character created", await rarity_attributes.character_created(id));
  }
}

beforeEach(async function () {
  // Load account
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

  const RarityAttributes = await ethers.getContractFactory("rarity_attributes");
  rarity_attributes = RarityAttributes.attach("0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1");

  const RarityCrafting = await ethers.getContractFactory("rarity_crafting_materials");
  rarity_crafting = RarityCrafting.attach("0x2A0F1cB17680161cF255348dDFDeE94ea8Ca196A");

  const RarityGold = await ethers.getContractFactory("rarity_gold");
  rar = RarityGold.attach("0x00000000000147629f002966c4f2adc1cb4f0aca");
  base = RarityGold.attach("0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2");

  const Caretaker = await ethers.getContractFactory("RarityCaretaker");
  caretaker = await Caretaker.connect(deployer).deploy();
  await caretaker.deployed();

  console.log("Deployed at", caretaker.address);
  console.log("Owner", await caretaker.owner());
  //expect(await caretaker.owner()).to.equal(deployer.address);

  // Summon 3 new characters
  const txn = await caretaker.connect(deployer).summon_n([1, 2, 3]);
  const receipt = await txn.wait();
  console.log(parseInt(await rarity.balanceOf(deployer.address)));
  console.log(parseInt(await rarity.balanceOf(caretaker.address)));

  const events = receipt.events;
  //console.log(events);
  for (let i = 0; i < events.length; i++) {
    if (("event" in events[i]) && (events[i].event == 'Received')) {
      //console.log(events[i].args);
      tokens.push(parseInt(events[i].args.tokenId));
    }
  }
  console.log(tokens);
});

describe("Caretaker", function () {
  it("Deploy and test caretaker contract", async function () {
    console.log("Testing Caretaker");

    // Approve contract for all txns
    //const txn0 = await rarity.connect(deployer).setApprovalForAll(caretaker.address, true);
    //const receipt0 = await txn0.wait();
    //console.log(receipt0);
    //sleep(SLEEPMS);

    // Initial value for all characters
    console.log("Id : Level, XP, Gold, Gems");
    for (let i = 0; i < tokens.length; i++) {
      const level = parseInt(ethers.utils.formatEther(await rarity.level(tokens[i])));
      const xp = parseInt(ethers.utils.formatEther(await rarity.xp(tokens[i])));
      const gold = parseInt(ethers.utils.formatEther(await base.balanceOf(tokens[i])));
      const gems = parseInt(ethers.utils.formatEther(await rarity_crafting.balanceOf(tokens[i])));
      console.log(tokens[i], level, xp, gold, gems);

      // Approve tokens if not approved
      await approval(tokens[i], caretaker.address);
      // const owner = await rarity.ownerOf(tokens[i]);
      // console.log(tokens[i], owner);
      // const txn = await rarity.connect(deployer).approve(caretaker.address, tokens[i]);
      // const receipt = txn.wait();
      // const approved = await rarity.getApproved(tokens[i]);
      // expect(approved).to.equal(caretaker.address);
    }

    // now characters should be able to visit cellar
    const txn3 = await caretaker.connect(deployer).doAll(tokens);
    const receipt3 = await txn3.wait();
    //console.log(receipt3);

    // Updated stats
    console.log("Id : Level, XP, Gold, Gems");
    for (let i = 0; i < tokens.length; i++) {
      const level = parseInt(ethers.utils.formatEther(await rarity.level(tokens[i])));
      const xp = parseInt(ethers.utils.formatEther(await rarity.xp(tokens[i])));
      const gold = parseInt(ethers.utils.formatEther(await base.balanceOf(tokens[i])));
      const gems = parseInt(ethers.utils.formatEther(await rarity_crafting.balanceOf(tokens[i])));
      console.log(tokens[i], level, xp, gold, gems);
    }
  });
});

/*
describe("Rarity Functions", function () {
  it("Test of set_default_attributes logic", async function () {
    for (let i = 0; i < tokens.length; i++) {
      const index = await rarity.class(tokens[i]);
      const approved = await rarity.getApproved(tokens[i]);
      console.log(index, approved);
    }

          attr.point_buy(
            _ids[i],
            default_dist[index][0],
            default_dist[index][1],
            default_dist[index][2],
            default_dist[index][3],
            default_dist[index][4],
            default_dist[index][5]
          );
        },

  });

  it("Make sure numbers are correct", async function () {
    for (let i = 0; i < attrs.length; i++) {
      const attr = attrs[i];
      let calc = parseInt(await rarity_attributes.calculate_point_buy(
        attr[0], attr[1], attr[2], attr[3], attr[4], attr[5]
      ));
      console.log(i, calc);
    }
    console.log(caretaker.address);
    for (let i = 0; i < 8; i++) {
      let calc = parseInt(await caretaker.test_defaults(i));
      console.log("Default Point Buy :", i, calc);
    }

  });
});
*/