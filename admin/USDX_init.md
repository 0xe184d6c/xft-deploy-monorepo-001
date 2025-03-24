Initialization Parameters

When deploying USDX, you need:
name_: Token name (e.g., "USD Stablecoin")
symbol_: Token symbol (e.g., "USDX")
owner: Admin address that gets DEFAULT_ADMIN_ROLE


Roles System
The contract uses role-based access:
DEFAULT_ADMIN_ROLE: Can grant/revoke other roles (given to owner during initialization)
MINTER_ROLE: Can mint tokens
BURNER_ROLE: Can burn tokens
BLOCKLIST_ROLE: Can block/unblock accounts
ORACLE_ROLE: Can adjust reward multiplier
UPGRADE_ROLE: Can upgrade contract
PAUSE_ROLE: Can pause/unpause


After deployment, the owner must explicitly grant these roles to appropriate addresses.
Shares Mechanism
Internal accounting uses shares instead of token amounts
rewardMultiplier begins at 1e18 (BASE)
When minting, tokens convert to shares: shares = (amount * BASE) / rewardMultiplier
When transferring/burning, shares convert to tokens: tokens = (shares * rewardMultiplier) / BASE
This mechanism allows token rebasing without changing user balances
Deployment Steps
Deploy with initialize(name, symbol, owner)
Owner grants roles (e.g., grantRole(MINTER_ROLE, minterAddress))
Minter mints initial tokens: mint(recipient, amount)