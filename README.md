# About
Caretaker with UI to interact with rarity summoners. Should be able to operate on all tokens and contracts.

It takes all the approved summoners in a wallet and takes them through these five steps
  - Adventure on Rarity
  - Level Up is possible
  - Claim gold if possible
  - Claim rar if possible
  - Visit cellar if there's any reward

You will only need to approve the tokens the first time you use. After that, every day, you can send the whole group of your summoners to the above mentioned tasks with one click. See details below.

Please NOTE that approval for each summoner will create a transaction for each of your summoners. This is due to the design of the Rarity Gold and Crafting contracts that do not take global approval. If someone finds a way around this issue, please let me know. 

Daily tasks do not have this issue, and will only need only 1 transaction regardless of the number of summoners. You can also run it multiple times if you add/approve more summoners later. It already takes into account which summoners can go on adventure at a given time.

## Hardhat Hackathon Boilerplate

This repository contains a sample project that you can use as the starting point
for your Ethereum project. It's also a great fit for learning the basics of
smart contract development.

This project is intended to be used with the
[Hardhat Beginners Tutorial](https://hardhat.org/tutorial), but you should be
able to follow it by yourself by reading the README and exploring its
`contracts`, `tests`, `scripts` and `frontend` directories.

## Quick start
You can either manually use the included scripts in the project, or launch the frontend to approve and do daily chores on your selected rarity characters

### To clone and setup
```
git clone git@github.com:modernAlcibiades/RarityCaretakerDapp.git
cd RarityCaretakerDapp
npm install
```
### To run
The following commands will start the frontend. Ypu will need Metamask wallet installed to use this dapp.
```
cd frontend
npm install
npm run start
```
After this, go to `http://localhost:3000/` if it does not automatically open in your browser.

![It should look like this](/FrontPage.png)
### To Approve
Once the frontend working, you can connect to your metamask with the `Connect` button. It will a list of all the Summoners that belong to you. Use the check marks to choose which summoners you wish to approve / send on daily tasks.

![The page should look like this](/AfterConnect.png)

- Approve
*You only need to approve each tokenId once*
After you have approved once, you will only need to approve again if you approved some other contract to manage your summoner

- Do Daily
This is the main task. It will take all the selected summoners and see if they are approved and can be sent for an adventure. After that, it will take all of the valid summoners and take them though these four steps
  - Adventure on Rarity
  - Level Up is possible
  - Claim gold if possible
  - Claim rar if possible
  - Visit cellar if there's any reward

Hope you have fun playing Rarity!

### Development Tasks
TODO
- Support for crafting
- Support for gambit
- Support for names in the UI and naming

DONE 
- UI with metamask connection, approval, and doAll
- Get all tokens valid for an address through ftmscan API
- Support claiming $RAR (0x00000000000147629f002966C4f2ADc1cB4f0Aca)
- Support doAll task in the caretaker


If you wish to support the project, add issues on Github, or fork the project. If you wish to support me, send some love to `0x252DD902190Be0b9aCac625996fDa7137A4b684c`

Peace!!
