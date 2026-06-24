# Hatch Skill - Staking Contract

## Purpose

Guide the user through designing and writing a staking contract on Base. Covers token staking, NFT staking, single-asset and dual-asset reward models.

## Questions to ask before writing code

If not already answered in the spec:

1. What are users staking? (ERC-20 token, NFT, or both)
2. What is the reward token? (same token, different token, or ETH)
3. How is the reward rate set? (fixed APR, emissions per block, admin-configurable)
4. Is there a lock-up period? If yes, what happens if they withdraw early?
5. Is there a minimum stake amount?
6. Can the owner change the reward rate after launch?
7. Does staking give any additional utility? (voting power, tier access, etc.)
8. Is there a max staking cap per wallet or globally?

## Standard ERC-20 staking with ERC-20 rewards

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract StakingVault is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC20 public immutable rewardToken;

    uint256 public rewardRate;          // reward tokens per second per staked token (scaled 1e18)
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;

    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    mapping(address => uint256) public balances;

    uint256 public totalStaked;
    uint256 public lockupPeriod;        // seconds, 0 = no lockup
    mapping(address => uint256) public lastStakeTime;

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);

    error LockupActive(uint256 unlocksAt);
    error InsufficientBalance();
    error ZeroAmount();

    constructor(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _lockupPeriod,
        address initialOwner
    ) Ownable(initialOwner) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
        rewardRate = _rewardRate;
        lockupPeriod = _lockupPeriod;
        lastUpdateTime = block.timestamp;
    }

    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }

    function rewardPerToken() public view returns (uint256) {
        if (totalStaked == 0) return rewardPerTokenStored;
        return rewardPerTokenStored + (
            (block.timestamp - lastUpdateTime) * rewardRate * 1e18 / totalStaked
        );
    }

    function earned(address account) public view returns (uint256) {
        return (
            balances[account] * (rewardPerToken() - userRewardPerTokenPaid[account]) / 1e18
        ) + rewards[account];
    }

    function stake(uint256 amount) external nonReentrant whenNotPaused updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        balances[msg.sender] += amount;
        totalStaked += amount;
        lastStakeTime[msg.sender] = block.timestamp;
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external nonReentrant updateReward(msg.sender) {
        if (amount == 0) revert ZeroAmount();
        if (balances[msg.sender] < amount) revert InsufficientBalance();
        if (lockupPeriod > 0) {
            uint256 unlocksAt = lastStakeTime[msg.sender] + lockupPeriod;
            if (block.timestamp < unlocksAt) revert LockupActive(unlocksAt);
        }
        balances[msg.sender] -= amount;
        totalStaked -= amount;
        stakingToken.safeTransfer(msg.sender, amount);
        emit Withdrawn(msg.sender, amount);
    }

    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.safeTransfer(msg.sender, reward);
            emit RewardClaimed(msg.sender, reward);
        }
    }

    function exit() external {
        withdraw(balances[msg.sender]);
        claimReward();
    }

    // Admin
    function setRewardRate(uint256 newRate) external onlyOwner updateReward(address(0)) {
        rewardRate = newRate;
        emit RewardRateUpdated(newRate);
    }

    function fundRewards(uint256 amount) external onlyOwner {
        rewardToken.safeTransferFrom(msg.sender, address(this), amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function recoverToken(address token, uint256 amount) external onlyOwner {
        require(token != address(stakingToken), "Cannot recover staking token");
        IERC20(token).safeTransfer(owner(), amount);
    }
}
```

## NFT staking variant

Key differences from ERC-20 staking:

```solidity
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract NFTStaking is ERC721Holder, Ownable, ReentrancyGuard {
    IERC721 public immutable nft;
    IERC20 public immutable rewardToken;

    struct Stake {
        address owner;
        uint256 stakedAt;
    }

    mapping(uint256 => Stake) public stakes;     // tokenId => stake info
    mapping(address => uint256[]) public stakedTokenIds;

    uint256 public rewardPerDay;                 // reward tokens per NFT per day

    function stakeNFT(uint256[] calldata tokenIds) external nonReentrant {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 id = tokenIds[i];
            stakes[id] = Stake(msg.sender, block.timestamp);
            stakedTokenIds[msg.sender].push(id);
            nft.safeTransferFrom(msg.sender, address(this), id);
        }
    }

    function pendingReward(uint256 tokenId) public view returns (uint256) {
        Stake memory s = stakes[tokenId];
        if (s.owner == address(0)) return 0;
        uint256 elapsed = block.timestamp - s.stakedAt;
        return elapsed * rewardPerDay / 1 days;
    }
}
```

## Audit flags specific to staking

- Reward math rounding: always round in favor of the protocol not the user
- `rewardRate` change mid-flight can cause under/over-payment -- always updateReward first
- Never let staking contract hold more reward tokens than it can pay out
- NFT staking: track original owner in mapping, not just transfer custody
- Early withdrawal penalty: make sure penalty goes to treasury, not burned (unless intended)

## Testing checklist

```solidity
- test_Stake()
- test_Withdraw()
- test_ClaimReward()
- test_Exit()
- test_LockupReverts()
- test_LockupExpires()
- test_RewardRateChange()
- test_MultipleStakers()
- testFuzz_RewardAccrual(uint256 amount, uint256 time)
- test_PauseBlocksStake()
- test_RecoverToken()
```
