# Hatch Deployment - Base Sepolia

## Purpose

Deploy audited contracts to Base Sepolia testnet. This is always the step before mainnet.

## Prerequisites

Before running this skill, confirm:
- [ ] Audit report shows "Cleared for deployment: YES"
- [ ] User has a funded wallet on Base Sepolia (get ETH from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet or https://faucet.quicknode.com/base/sepolia)
- [ ] Foundry is installed (`forge --version`)
- [ ] `.env` file is set up with `PRIVATE_KEY` and `BASE_SEPOLIA_RPC`

## Deployment flow

### Step 1 - Foundry project setup

```bash
forge init [project-name]
cd [project-name]
forge install OpenZeppelin/openzeppelin-contracts
forge install OpenZeppelin/openzeppelin-contracts-upgradeable
```

### Step 2 - foundry.toml config

```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.24"

[rpc_endpoints]
base_sepolia = "${BASE_SEPOLIA_RPC}"
base_mainnet = "${BASE_MAINNET_RPC}"

[etherscan]
base_sepolia = { key = "${BASESCAN_API_KEY}", url = "https://api-sepolia.basescan.org/api" }
base_mainnet = { key = "${BASESCAN_API_KEY}", url = "https://api.basescan.org/api" }
```

### Step 3 - Deploy script

```solidity
// script/Deploy.s.sol
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/[YourContract].sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        [YourContract] deployed = new [YourContract]([constructor args]);

        vm.stopBroadcast();

        console.log("[YourContract] deployed to:", address(deployed));
    }
}
```

### Step 4 - Run deployment

```bash
forge script script/Deploy.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

### Step 5 - Verify on Basescan

If auto-verify fails:

```bash
forge verify-contract [deployed-address] src/[YourContract].sol:[YourContract] \
  --chain-id 84532 \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor([types])" [values])
```

### Step 6 - Post-deploy checklist

- [ ] Contract visible on https://sepolia.basescan.org
- [ ] Source code verified (green checkmark)
- [ ] Run a full user flow test on testnet
- [ ] Test all privileged functions from owner address
- [ ] Test edge cases: zero amounts, max amounts, unauthorized callers

## Base Sepolia details

- Chain ID: 84532
- RPC: https://sepolia.base.org (public) or Alchemy/QuickNode
- Basescan: https://sepolia.basescan.org
- Bridge: https://bridge.base.org (for testnet ETH)

## After Sepolia testing

Tell the user: "Testnet deployment complete. Once you've tested all flows, we can move to mainnet deployment. Load `deployment/base-mainnet` to continue."
