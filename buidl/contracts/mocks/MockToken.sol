// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../token/IDSToken.sol";

contract MockToken is IDSToken {
    function initialize(string memory, string memory, uint8) external override {}
    function name() external pure override returns (string memory) { return "Mock Token"; }
    function symbol() external pure override returns (string memory) { return "MOCK"; }
    function decimals() external pure override returns (uint8) { return 18; }
    function totalSupply() external view override returns (uint256) { return 0; }
    function balanceOf(address) external view override returns (uint256) { return 0; }
    function transfer(address, uint256) external override returns (bool) { return true; }
    function allowance(address, address) external view override returns (uint256) { return 0; }
    function approve(address, uint256) external override returns (bool) { return true; }
    function transferFrom(address, address, uint256) external override returns (bool) { return true; }
    function isPaused() external view override returns (bool) { return false; }
    function mint(address, uint256) external override returns (bool) { return true; }
    function burn(address, uint256) external override returns (bool) { return true; }
    function getDSService(bytes32) external view override returns (address) { return address(0); }
    function hasRole(address, bytes32) external view override returns (bool) { return false; }
}