// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");

let tokens = [
    2371608, 2371609,

    2383706, 2383707,
    2383708, 2383709,
    2383710, 2383711,
    2383712, 2383713,
    2383714, 2383715,
    2383716,

    2385269,
    2385270, 2385271,
    2385272, 2385273,
    2385274, 2385275,
    2385276, 2385277,
    2385278, 2385279
];
let deployer;
let rarity, rarity_attributes, caretaker;
let nonce, txn, receipt;
let SLEEPMS = 1000;

async function approval(id, addr) {
    const approved = await rarity.getApproved(id);
    console.log("Approved", id, approved);
    if (approved != addr) {
        const txn = await rarity.connect(deployer).approve(caretaker.address, id);
        const receipt = txn.wait();
        await wait_nonce();
        const approved = await rarity.getApproved(id);
        console.log("Approved", id, approved);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function wait_nonce() {
    while (nonce == await deployer.getTransactionCount()) {
        await sleep(SLEEPMS);
        console.log("Nonce not updated", nonce);
    }
    nonce++;
}

async function main() {
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
    nonce = await deployer.getTransactionCount();
    console.log("Nonce", nonce);

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
    caretaker = await Caretaker.attach(process.env.CONTRACT_ADDRESS);

    console.log("Deployed at", caretaker.address);
    console.log("Owner", await caretaker.owner());

    // Initial value for all characters
    console.log("Id : Level, XP, Gold, Gems");
    for (let i = 0; i < tokens.length; i++) {
        const level = parseInt(ethers.utils.formatEther(await rarity.level(tokens[i])));
        const xp = parseInt(ethers.utils.formatEther(await rarity.xp(tokens[i])));
        const gold = parseInt(ethers.utils.formatEther(await base.balanceOf(tokens[i])));
        const gems = parseInt(ethers.utils.formatEther(await rarity_crafting.balanceOf(tokens[i])));
        console.log(tokens[i], level, xp, gold, gems);

        // Approve tokens if not approved
        try {
            nonce = await approval(tokens[i], `${caretaker.address}`);
            // level up
            txn = await rarity.level_up(tokens[i]);
            receipt = await txn.wait();
            console.log(receipt.events);
            await wait_nonce();
        } catch (e) {
            console.log(e)
        }
        try {
            // claim rar and gold
            txn = await rar.claim(tokens[i]);
            receipt = await txn.wait();
            console.log(receipt.events);
            await wait_nonce();

            txn = await base.claim(tokens[i]);
            receipt = await txn.wait();
            console.log(receipt.events);
            await wait_nonce();
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
