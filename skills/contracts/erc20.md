# Hatch Skill - ERC-20 Token

## Purpose

Guide the user through designing and writing an ERC-20 token contract on Base. This skill covers standard tokens, governance tokens, utility tokens, and fee tokens.

## Questions to ask before writing code

If not already answered in the spec:

1. What is the token name and symbol?
2. What is the total supply? Is it fixed or mintable?
3. Who can mint? (deployer only, a contract, a DAO, nobody after launch)
4. Is there a burn mechanism?
5. Does this token need to be pausable?
6. Is this a governance token? (adds ERC-20Votes extension)
7. Are there transfer restrictions? (whitelist, blacklist, cooldown)
8. Does it need permit support? (EIP-2612 -- gasless approvals)

## Standard implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract [TokenName] is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = [supply] * 10 ** 18;

    constructor(address initialOwner)
        ERC20("[Token Name]", "[SYMBOL]")
        ERC20Permit("[Token Name]")
        Ownable(initialOwner)
    {
        _mint(initialOwner, MAX_SUPPLY);
    }

    // Only include if mintable after deploy
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}
```

## Governance token variant

Add these if the token is used for DAO voting:

```solidity
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract [TokenName] is ERC20, ERC20Permit, ERC20Votes, Ownable {
    // ERC20Votes requires ERC20Permit
    // Users must call delegate() to activate voting power
    // Self-delegate: token.delegate(msg.sender)

    function _update(address from, address to, uint256 value)
        internal override(ERC20, ERC20Votes)
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public view override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
```

## Clanker launch variant

If the user wants to launch via Clanker, do NOT write a token contract. Clanker deploys the token. Instead:

- Tell the user Clanker handles the ERC-20 deployment
- Load `protocols/clanker` skill for the launch flow
- The contracts skill is only needed if they want custom token logic Clanker doesn't support

## Bankr launch variant

Same as Clanker -- if launching via Bankr, load `protocols/bankr` instead of writing a token contract manually.

## Audit flags specific to ERC-20

- If mintable: is there a supply cap? Uncapped mint is a HIGH risk
- If pausable: who can pause? Can it be paused forever? (centralization risk)
- If there are transfer hooks: reentrancy risk on every transfer
- If fee-on-transfer: flag every contract that will interact with this token -- they all need special handling

## Testing checklist

```solidity
// test/Token.t.sol
- test_InitialSupply()
- test_Transfer()
- test_Approve_and_TransferFrom()
- test_Burn()
- test_MintOnlyOwner()
- test_MintExceedsMaxSupply()
- test_Permit()
- testFuzz_Transfer(address, uint256)
```

## Common mistakes to flag

- Minting to `address(0)` -- OZ will revert but catch it early
- Setting MAX_SUPPLY without the `* 10 ** decimals()` scaling
- Forgetting to call `delegate()` before testing governance voting power
- Using `transfer()` instead of `safeTransfer()` when interacting with this token from another contract
