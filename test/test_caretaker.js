const { expect } = require("chai");
const { ethers } = require("hardhat");

let deployer;
let rarity, rarity_attributes, caretaker;
let tokens = [];
const attrs = [
  [16, 12, 14, 12, 12, 12], //barbarian, 
  [12, 12, 14, 12, 12, 16], //bard
  [12, 12, 14, 16, 12, 12], //cleric
  [16, 16, 11, 11, 11, 11]] //random

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
    console.log("Testing Caretaker")

    // Bind to rarity contract, approve adventuring
    /*
    // NOTE : Bug in global approval, doesn't work with point buy
    // Specifically getApproved() function in rarity main contract

    const txn0 = await rarity.connect(deployer).setApprovalForAll(caretaker.address, true);
    const receipt0 = await txn0.wait();
    const approved0 = await rarity.getApproved(tokens[0]);
    console.log(approved0);
    */

    for (let i = 0; i < tokens.length; i++) {
      const txn = await rarity.connect(deployer).approve(caretaker.address, tokens[i]);
      const receipt = txn.wait();
      const approved = await rarity.getApproved(tokens[i]);
      expect(approved).to.equal(caretaker.address);
    }

    /*
    // Send the summoned characters to adventure
    const txn1 = await caretaker.connect(deployer).doAll(tokens);
    //const receipt1 = await txn1.wait();
    //console.log(receipt1);
    // xp of all the characters should be 250
    for (let i = 0; i < tokens.length; i++) {
      const xp = parseInt(ethers.utils.formatEther(await rarity.xp(tokens[i])));
      console.log("XP :", tokens[i], xp);
      expect(xp).to.equal(250);
    }
    */

    // buy attributes for all characters
    const txn2 = await caretaker.connect(deployer).set_default_attributes(tokens);
    const receipt2 = await txn2.wait();
    console.log(receipt2);


    // now characters should be able to visit cellar
    for (let i = 0; i < tokens.length; i++) {
      const score = await rarity_attributes.ability_scores(tokens[i]);
      console.log("Attributes :", tokens[i], score);
      for (let j = 0; j < 6; j++) {
        expect(score[j]).to.equal(attrs[i][j]);
      }
    }

    // now characters should be able to visit cellar
    const txn3 = await caretaker.connect(deployer).doAll(tokens);
    const receipt3 = await txn3.wait();
    //console.log(receipt3);

    // xp of all the characters should be 250
    for (let i = 0; i < tokens.length; i++) {
      const xp = parseInt(ethers.utils.formatEther(await rarity.xp(tokens[i])));
      console.log("XP :", tokens[i], xp);
      const gems = parseInt(ethers.utils.formatEther(await rarity_crafting.balanceOf(tokens[i])));
      console.log('Cellar loot', tokens[i], gems);
    }
    //scout
    //expected value should be the same as scouted value

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