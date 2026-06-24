# Hatch Skill - Governance / DAO

## Purpose

Guide the user through designing and writing a DAO governance system on Base using OpenZeppelin Governor. Covers proposal creation, voting, timelock execution, and quorum settings.

## Questions to ask before writing code

If not already answered in the spec:

1. What token is used for voting? (must be ERC-20Votes or ERC-721Votes)
2. What is the voting delay? (blocks between proposal creation and voting start)
3. What is the voting period? (blocks during which votes are accepted)
4. What is the quorum? (percentage of total supply needed to pass)
5. What is the proposal threshold? (minimum tokens needed to submit a proposal)
6. Is there a timelock? (delay between vote passing and execution -- strongly recommended)
7. Who can cancel proposals?
8. Do you need on-chain execution or just signaling?

## Standard Governor implementation

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorSettings.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

contract [DAOName]Governor is
    Governor,
    GovernorSettings,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("[DAOName] Governor")
        GovernorSettings(
            7200,   // voting delay: ~1 day in blocks (Base ~2s blocks)
            50400,  // voting period: ~7 days
            100e18  // proposal threshold: 100 tokens
        )
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(4)  // 4% quorum
        GovernorTimelockControl(_timelock)
    {}

    // Required overrides
    function votingDelay() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingDelay();
    }

    function votingPeriod() public view override(Governor, GovernorSettings) returns (uint256) {
        return super.votingPeriod();
    }

    function quorum(uint256 blockNumber)
        public view override(Governor, GovernorVotesQuorumFraction)
        returns (uint256)
    {
        return super.quorum(blockNumber);
    }

    function proposalThreshold()
        public view override(Governor, GovernorSettings)
        returns (uint256)
    {
        return super.proposalThreshold();
    }

    function state(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
        return super.state(proposalId);
    }

    function proposalNeedsQueuing(uint256 proposalId)
        public view override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor()
        internal view override(Governor, GovernorTimelockControl)
        returns (address)
    {
        return super._executor();
    }
}
```

## Timelock controller

Deploy this alongside the Governor:

```solidity
import "@openzeppelin/contracts/governance/TimelockController.sol";

// In deploy script:
address[] memory proposers = new address[](1);
proposers[0] = address(governor);

address[] memory executors = new address[](1);
executors[0] = address(0); // anyone can execute after delay

TimelockController timelock = new TimelockController(
    2 days,      // min delay
    proposers,
    executors,
    address(0)   // no admin after setup
);
```

## Proposal lifecycle

```
propose() → voting delay → vote() → voting period → queue() → timelock delay → execute()
```

Example proposal to change a parameter:

```solidity
// targets, values, calldatas, description
address[] memory targets = new address[](1);
targets[0] = address(treasury);

uint256[] memory values = new uint256[](1);
values[0] = 0;

bytes[] memory calldatas = new bytes[](1);
calldatas[0] = abi.encodeWithSignature("setFee(uint256)", 200);

string memory description = "Proposal #1: Set protocol fee to 2%";

governor.propose(targets, values, calldatas, description);
```

## Voting power reminder

Tell the user: token holders must call `token.delegate(address)` to activate their voting power. Self-delegation: `token.delegate(msg.sender)`. Without delegation, tokens count as 0 votes even if held.

## Block numbers on Base

Base produces blocks approximately every 2 seconds. Useful conversions:
- 1 day = ~43,200 blocks
- 7 days = ~302,400 blocks
- 1 hour = ~1,800 blocks

## Audit flags specific to governance

- Flash loan governance attacks: use snapshot-based voting (ERC20Votes does this)
- Quorum too low: 1-4% can be reached by a single whale
- No timelock = immediate execution after vote passes (critical risk)
- Proposal spam: set a meaningful proposal threshold
- Timelock admin should be renounced or set to the DAO itself after setup

## Testing checklist

```solidity
- test_Propose()
- test_Vote()
- test_QuorumNotReached()
- test_VoteDefeated()
- test_QueueAndExecute()
- test_TimelockDelay()
- test_CancelProposal()
- test_ProposalThresholdReverts()
- test_FlashLoanCannotVote()
```
