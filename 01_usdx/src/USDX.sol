// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title USDX
 * @notice A stablecoin with reward multiplier, blocklisting and pausable features
 */
contract USDX is ERC20, AccessControl, Pausable {
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    bytes32 public constant BLOCKLIST_ROLE = keccak256("BLOCKLIST_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // State variables
    uint256 public rewardMultiplier;
    mapping(address => bool) private _blockedAddresses;
    mapping(address => uint256) private _shares;
    uint256 private _totalShares;

    // Events
    event RewardMultiplierUpdated(uint256 previousMultiplier, uint256 newMultiplier);
    event AccountBlocked(address indexed account);
    event AccountUnblocked(address indexed account);

    // Modifiers
    modifier notBlocked(address account) {
        require(!_blockedAddresses[account], "USDX: account is blocked");
        _;
    }

    /**
     * @notice Constructor
     * @param name The name of the token
     * @param symbol The symbol of the token
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        _setupRole(BURNER_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
        _setupRole(BLOCKLIST_ROLE, msg.sender);
        _setupRole(ORACLE_ROLE, msg.sender);
        
        rewardMultiplier = 100; // 1.00x as default
    }

    /**
     * @notice Mint new tokens
     * @param to Address to receive the tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) 
        external 
        onlyRole(MINTER_ROLE) 
        notBlocked(to) 
        whenNotPaused 
    {
        uint256 sharesToMint = convertToShares(amount);
        _totalShares += sharesToMint;
        _shares[to] += sharesToMint;
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from an address
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) 
        external 
        onlyRole(BURNER_ROLE) 
        whenNotPaused 
    {
        uint256 sharesToBurn = convertToShares(amount);
        _totalShares -= sharesToBurn;
        _shares[from] -= sharesToBurn;
        _burn(from, amount);
    }

    /**
     * @notice Set the reward multiplier
     * @param multiplier The new multiplier (100 = 1.00x)
     */
    function setRewardMultiplier(uint256 multiplier) external onlyRole(ORACLE_ROLE) {
        emit RewardMultiplierUpdated(rewardMultiplier, multiplier);
        rewardMultiplier = multiplier;
    }

    /**
     * @notice Add to the reward multiplier
     * @param amount The amount to add to the multiplier
     */
    function addRewardMultiplier(uint256 amount) external onlyRole(ORACLE_ROLE) {
        uint256 newMultiplier = rewardMultiplier + amount;
        emit RewardMultiplierUpdated(rewardMultiplier, newMultiplier);
        rewardMultiplier = newMultiplier;
    }

    /**
     * @notice Block multiple accounts
     * @param accounts The accounts to block
     */
    function blockAccounts(address[] calldata accounts) external onlyRole(BLOCKLIST_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _blockedAddresses[accounts[i]] = true;
            emit AccountBlocked(accounts[i]);
        }
    }

    /**
     * @notice Unblock multiple accounts
     * @param accounts The accounts to unblock
     */
    function unblockAccounts(address[] calldata accounts) external onlyRole(BLOCKLIST_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            _blockedAddresses[accounts[i]] = false;
            emit AccountUnblocked(accounts[i]);
        }
    }

    /**
     * @notice Check if an account is blocked
     * @param account The account to check
     * @return True if the account is blocked
     */
    function isBlocked(address account) external view returns (bool) {
        return _blockedAddresses[account];
    }

    /**
     * @notice Pause all token transfers
     */
    function pause() external onlyRole(PAUSE_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause all token transfers
     */
    function unpause() external onlyRole(PAUSE_ROLE) {
        _unpause();
    }

    /**
     * @notice Convert tokens to shares
     * @param tokens Amount of tokens
     * @return Amount of shares
     */
    function convertToShares(uint256 tokens) public view returns (uint256) {
        return (tokens * 100) / rewardMultiplier;
    }

    /**
     * @notice Convert shares to tokens
     * @param shares Amount of shares
     * @return Amount of tokens
     */
    function convertToTokens(uint256 shares) public view returns (uint256) {
        return (shares * rewardMultiplier) / 100;
    }

    /**
     * @notice Get the amount of shares for an account
     * @param account The account to get shares for
     * @return Amount of shares
     */
    function sharesOf(address account) external view returns (uint256) {
        return _shares[account];
    }

    /**
     * @notice Get the total amount of shares
     * @return Total amount of shares
     */
    function totalShares() external view returns (uint256) {
        return _totalShares;
    }

    // Override ERC20 transfer functions
    function transfer(address to, uint256 amount) 
        public 
        override 
        notBlocked(msg.sender) 
        notBlocked(to) 
        whenNotPaused 
        returns (bool) 
    {
        uint256 sharesToTransfer = convertToShares(amount);
        _shares[msg.sender] -= sharesToTransfer;
        _shares[to] += sharesToTransfer;
        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        notBlocked(from) 
        notBlocked(to) 
        whenNotPaused 
        returns (bool) 
    {
        uint256 sharesToTransfer = convertToShares(amount);
        _shares[from] -= sharesToTransfer;
        _shares[to] += sharesToTransfer;
        return super.transferFrom(from, to, amount);
    }
}