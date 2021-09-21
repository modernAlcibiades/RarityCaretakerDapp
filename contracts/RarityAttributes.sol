/**
 *Submitted for verification at FtmScan.com on 2021-09-06
 */

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "./Rarity.sol";
import "./Base64.sol";

contract rarity_attributes {
    uint256 constant POINT_BUY = 32;
    rarity constant rm = rarity(0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb);

    struct ability_score {
        uint32 strength;
        uint32 dexterity;
        uint32 constitution;
        uint32 intelligence;
        uint32 wisdom;
        uint32 charisma;
    }

    mapping(uint256 => ability_score) public ability_scores;
    mapping(uint256 => uint256) public level_points_spent;
    mapping(uint256 => bool) public character_created;

    event Created(
        address indexed creator,
        uint256 summoner,
        uint32 strength,
        uint32 dexterity,
        uint32 constitution,
        uint32 intelligence,
        uint32 wisdom,
        uint32 charisma
    );
    event Leveled(
        address indexed leveler,
        uint256 summoner,
        uint32 strength,
        uint32 dexterity,
        uint32 constitution,
        uint32 intelligence,
        uint32 wisdom,
        uint32 charisma
    );

    function _isApprovedOrOwner(uint256 _summoner)
        internal
        view
        returns (bool)
    {
        return
            rm.getApproved(_summoner) == msg.sender ||
            rm.ownerOf(_summoner) == msg.sender;
    }

    function point_buy(
        uint256 _summoner,
        uint32 _str,
        uint32 _dex,
        uint32 _const,
        uint32 _int,
        uint32 _wis,
        uint32 _cha
    ) external {
        require(_isApprovedOrOwner(_summoner));
        require(!character_created[_summoner]);
        require(
            calculate_point_buy(_str, _dex, _const, _int, _wis, _cha) ==
                POINT_BUY
        );
        character_created[_summoner] = true;

        ability_scores[_summoner] = ability_score(
            _str,
            _dex,
            _const,
            _int,
            _wis,
            _cha
        );
        emit Created(
            msg.sender,
            _summoner,
            _str,
            _dex,
            _const,
            _int,
            _wis,
            _cha
        );
    }

    function calculate_point_buy(
        uint256 _str,
        uint256 _dex,
        uint256 _const,
        uint256 _int,
        uint256 _wis,
        uint256 _cha
    ) public pure returns (uint256) {
        return
            calc(_str) +
            calc(_dex) +
            calc(_const) +
            calc(_int) +
            calc(_wis) +
            calc(_cha);
    }

    function calc(uint256 score) public pure returns (uint256) {
        if (score <= 14) {
            return score - 8;
        } else {
            return ((score - 8)**2) / 6;
        }
    }

    function _increase_base(uint256 _summoner) internal {
        require(_isApprovedOrOwner(_summoner));
        require(character_created[_summoner]);
        uint256 _points_spent = level_points_spent[_summoner];
        require(abilities_by_level(rm.level(_summoner)) - _points_spent > 0);
        level_points_spent[_summoner] = _points_spent + 1;
    }

    function increase_strength(uint256 _summoner) external {
        _increase_base(_summoner);
        ability_score storage _attr = ability_scores[_summoner];
        _attr.strength = _attr.strength + 1;
        emit Leveled(
            msg.sender,
            _summoner,
            _attr.strength,
            _attr.dexterity,
            _attr.constitution,
            _attr.intelligence,
            _attr.wisdom,
            _attr.charisma
        );
    }

    function increase_dexterity(uint256 _summoner) external {
        _increase_base(_summoner);
        ability_score storage _attr = ability_scores[_summoner];
        _attr.dexterity = _attr.dexterity + 1;
        emit Leveled(
            msg.sender,
            _summoner,
            _attr.strength,
            _attr.dexterity,
            _attr.constitution,
            _attr.intelligence,
            _attr.wisdom,
            _attr.charisma
        );
    }

    function increase_constitution(uint256 _summoner) external {
        _increase_base(_summoner);
        ability_score storage _attr = ability_scores[_summoner];
        _attr.constitution = _attr.constitution + 1;
        emit Leveled(
            msg.sender,
            _summoner,
            _attr.strength,
            _attr.dexterity,
            _attr.constitution,
            _attr.intelligence,
            _attr.wisdom,
            _attr.charisma
        );
    }

    function increase_intelligence(uint256 _summoner) external {
        _increase_base(_summoner);
        ability_score storage _attr = ability_scores[_summoner];
        _attr.intelligence = _attr.intelligence + 1;
        emit Leveled(
            msg.sender,
            _summoner,
            _attr.strength,
            _attr.dexterity,
            _attr.constitution,
            _attr.intelligence,
            _attr.wisdom,
            _attr.charisma
        );
    }

    function increase_wisdom(uint256 _summoner) external {
        _increase_base(_summoner);
        ability_score storage _attr = ability_scores[_summoner];
        _attr.wisdom = _attr.wisdom + 1;
        emit Leveled(
            msg.sender,
            _summoner,
            _attr.strength,
            _attr.dexterity,
            _attr.constitution,
            _attr.intelligence,
            _attr.wisdom,
            _attr.charisma
        );
    }

    function increase_charisma(uint256 _summoner) external {
        _increase_base(_summoner);
        ability_score storage _attr = ability_scores[_summoner];
        _attr.charisma = _attr.charisma + 1;
        emit Leveled(
            msg.sender,
            _summoner,
            _attr.strength,
            _attr.dexterity,
            _attr.constitution,
            _attr.intelligence,
            _attr.wisdom,
            _attr.charisma
        );
    }

    function abilities_by_level(uint256 current_level)
        public
        pure
        returns (uint256)
    {
        return current_level / 4;
    }

    function tokenURI(uint256 _summoner) public view returns (string memory) {
        string memory output;
        {
            string[7] memory parts;
            ability_score memory _attr = ability_scores[_summoner];
            parts[
                0
            ] = '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350"><style>.base { fill: white; font-family: serif; font-size: 14px; }</style><rect width="100%" height="100%" fill="black" /><text x="10" y="20" class="base">';

            parts[1] = string(
                abi.encodePacked(
                    "strength",
                    " ",
                    toString(_attr.strength),
                    '</text><text x="10" y="40" class="base">'
                )
            );

            parts[2] = string(
                abi.encodePacked(
                    "dexterity",
                    " ",
                    toString(_attr.dexterity),
                    '</text><text x="10" y="60" class="base">'
                )
            );

            parts[3] = string(
                abi.encodePacked(
                    "constitution",
                    " ",
                    toString(_attr.constitution),
                    '</text><text x="10" y="60" class="base">'
                )
            );

            parts[4] = string(
                abi.encodePacked(
                    "intelligence",
                    " ",
                    toString(_attr.intelligence),
                    '</text><text x="10" y="60" class="base">'
                )
            );

            parts[5] = string(
                abi.encodePacked(
                    "wisdom",
                    " ",
                    toString(_attr.wisdom),
                    '</text><text x="10" y="60" class="base">'
                )
            );

            parts[6] = string(
                abi.encodePacked(
                    "charisma",
                    " ",
                    toString(_attr.charisma),
                    "</text></svg>"
                )
            );

            output = string(
                abi.encodePacked(
                    parts[0],
                    parts[1],
                    parts[2],
                    parts[3],
                    parts[4],
                    parts[5],
                    parts[6]
                )
            );
        }
        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "summoner #',
                        toString(_summoner),
                        '", "description": "Rarity is achieved via an active economy, summoners must level, gain feats, learn spells, to be able to craft gear. This allows for market driven rarity while allowing an ever growing economy. Feats, spells, and summoner gear is ommitted as part of further expansions.", "image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(output)),
                        '"}'
                    )
                )
            )
        );
        output = string(
            abi.encodePacked("data:application/json;base64,", json)
        );

        return output;
    }

    function toString(uint256 value) internal pure returns (string memory) {
        // Inspired by OraclizeAPI's implementation - MIT license
        // https://github.com/oraclize/ethereum-api/blob/b42146b063c7d6ee1358846c198246239e9360e8/oraclizeAPI_0.4.25.sol

        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
