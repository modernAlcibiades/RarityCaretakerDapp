// Summon 11 new characters
const txn = await caretaker.connect(deployer).summon_n([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const receipt = await txn.wait();
console.log(parseInt(await rarity.balanceOf(deployer.address)));
console.log(parseInt(await rarity.balanceOf(caretaker.address)));

const events = receipt.events;
for (let i = 0; i < events.length; i++) {
    if (("event" in events[i]) && (events[i].event == 'Received')) {
        try {
            await approval(parseInt(events[i].args.tokenId));
        } catch (e) {
            console.log(e);
        }
    }
}