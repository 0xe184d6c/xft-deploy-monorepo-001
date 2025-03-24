// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title Storage2
 * @dev Store & retrieve a number
 */
contract Storage2 {
    // Single state variable
    uint256 private number;

    /**
     * @dev Store a number in the contract
     * @param num The number to store
     */
    function store(uint256 num) public {
        number = num;
    }

    /**
     * @dev Retrieve the stored number
     * @return The stored number
     */
    function retrieve() public view returns (uint256) {
        return number;
    }
}