pragma solidity 0.8.7;

import "./RarityAttributes.sol";
import "./RarityCraftingMaterials.sol";
import "./RarityGold.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AdventureTime
 * @dev sends multiple summoners on an adventure
 */
contract RarityCaretaker is Ownable, IERC721Receiver {
    // Parent contracts and other constants
    rarity public master = rarity(0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb);
    rarity_attributes public attr =
        rarity_attributes(0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1);
    rarity_gold base = rarity_gold(0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2);
    rarity_gold rar = rarity_gold(0x00000000000147629f002966C4f2ADc1cB4f0Aca);

    rarity_crafting_materials public cellar =
        rarity_crafting_materials(0x2A0F1cB17680161cF255348dDFDeE94ea8Ca196A);

    bytes4 retval =
        bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"));

    // Events
    event Received(
        address operator,
        address from,
        address origin,
        uint256 tokenId,
        bytes data,
        uint256 gas
    );

    event Cellar(uint256 tokenid, uint256 reward);

    uint32[6][8] default_dist = [
        [16, 12, 14, 12, 12, 12], //barbarian,
        [12, 12, 14, 12, 12, 16], //bard
        [12, 12, 14, 16, 12, 12], //cleric, sorcerer
        [12, 12, 15, 12, 15, 12], //druid
        [14, 12, 15, 14, 12, 12], //paladin, monk
        [12, 16, 14, 12, 12, 12], //ranger
        [14, 15, 14, 12, 12, 12], //rogue, fighter
        [12, 12, 12, 14, 16, 12] //wizard
    ];

    function dd(uint256 id) public pure returns (uint256 index) {
        if (id == 1) {
            index = 0;
        } else if (id == 2) {
            index = 1;
        } else if (id == 3 || id == 10) {
            index = 2;
        } else if (id == 4) {
            index = 3;
        } else if (id == 6 || id == 7) {
            index = 4;
        } else if (id == 8) {
            index = 5;
        } else if (id == 9 || id == 5) {
            index = 6;
        } else if (id == 11) {
            index = 7;
        }
    }

    // summon n characters of the list of classes
    function summon_n(uint256[] calldata _classes) external {
        uint256 len = _classes.length;
        for (uint256 i = 0; i < len; i++) {
            master.summon(_classes[i]);
        }
    }

    function test_defaults(uint256 index) public view returns (uint256) {
        return
            attr.calculate_point_buy(
                default_dist[index][0],
                default_dist[index][1],
                default_dist[index][2],
                default_dist[index][3],
                default_dist[index][4],
                default_dist[index][5]
            );
    }

    // add points : needs to be approved for this
    function set_default_attributes(uint256[] calldata _ids) external {
        uint256 len = _ids.length;
        for (uint256 i = 0; i < len; i++) {
            // get class of character
            uint256 index = dd(master.class(_ids[i]));

            attr.point_buy(
                _ids[i],
                default_dist[index][0],
                default_dist[index][1],
                default_dist[index][2],
                default_dist[index][3],
                default_dist[index][4],
                default_dist[index][5]
            );
        }
    }

    function adventure_time(uint256[] calldata _ids) external {
        uint256 len = _ids.length;
        for (uint256 i = 0; i < len; i++) {
            master.adventure(_ids[i]);
        }
        // that's literally it
    }

    function doAll(uint256[] calldata _ids) external {
        uint256 len = _ids.length;
        for (uint256 i = 0; i < len; i++) {
            // Check if can adventure
            if (
                master.getApproved(_ids[i]) == address(this) ||
                master.isApprovedForAll(master.ownerOf(_ids[i]), address(this))
            ) {
                if (block.timestamp > master.adventurers_log(_ids[i])) {
                    master.adventure(_ids[i]);
                }

                // Check if can be leveled up
                if (
                    master.xp_required(master.level(_ids[i])) <=
                    master.xp(_ids[i])
                ) {
                    master.level_up(_ids[i]);

                    // Rar contract is pretty shitty
                    if (rar.claimable(_ids[i]) > 0) {
                        rar.claim(_ids[i]);
                    }
                    if (base.claimable(_ids[i]) > 0) {
                        base.claim(_ids[i]);
                    }
                }

                // Check if can go to the cellar
                if (
                    block.timestamp > cellar.adventurers_log(_ids[i]) &&
                    cellar.scout(_ids[i]) > 0
                ) {
                    cellar.adventure(_ids[i]);
                }
            }
        }
        // that's literally it
    }

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external override returns (bytes4) {
        emit Received(operator, from, tx.origin, tokenId, data, gasleft());
        master.safeTransferFrom(address(this), tx.origin, tokenId);
        return retval;
    }
}
