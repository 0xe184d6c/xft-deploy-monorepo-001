// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.20;

import "../compliance/IDSWalletManager.sol";

contract MockWalletManager is IDSWalletManager {
    function isPlatformWallet(address) external view override returns (bool) {
        return false;
    }
    
    function isIssuerSpecialWallet(address) external view override returns (bool) {
        return false;
    }
    
    function isWalletMultiRole(address) external view override returns (bool) {
        return false;
    }
}