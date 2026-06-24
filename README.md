# 🐣 Hatch

**From idea to deployed dapp on Base. Works with Claude Code, Cursor, and Codex.**

Hatch is an open source AI skill layer. Install it once and your AI coding assistant gains the ability to guide you through every phase of building on Base -- from a rough idea all the way to a verified, deployed contract with a frontend.

---

## Install

```bash
npm install -g hatch-base
hatch install
```

That's it. Hatch detects which AI tools you have and configures them automatically.

---

## How it works

Open a new session in your AI tool and describe what you want to build:

> "I want to build an NFT staking platform with yield"

> "I want to launch a fair-launch token with a bonding curve"

> "I want to build a DAO for my community on Base"

Hatch takes it from there. Your AI assistant will:

1. Ask you the right questions to clarify the idea
2. Produce a spec for your confirmation
3. Design the contract architecture
4. Write the contracts (Foundry / Solidity)
5. Run through a security audit checklist
6. Deploy to Base Sepolia for testing
7. Deploy to Base mainnet
8. Scaffold the frontend (web app or Farcaster miniapp)

---

## Supported tools

| Tool | Status |
|---|---|
| Claude Code | Supported |
| Cursor | Supported |
| Codex | Supported |
| Windsurf | Coming soon |
| Copilot | Coming soon |

---

## Skills included

**Core**
- `dispatcher` -- routes your idea to the right workflow
- `questionnaire` -- extracts a buildable spec from any idea
- `architecture` -- maps your spec to a contract structure

**Contracts**
- ERC-20, ERC-721, ERC-1155
- Staking, Governance, Vesting
- Bonding curve, Vault, AMM

**Auditing**
- Universal security checklist
- Reentrancy patterns
- Oracle manipulation
- Access control review

**Deployment**
- Base Sepolia (testnet)
- Base mainnet
- Basescan verification

**Frontend**
- wagmi web app scaffold
- Farcaster miniapp
- Farcaster Frames

---

## Commands

```bash
hatch install       # Install and configure for detected AI tools
hatch detect        # See which AI tools Hatch found
hatch list          # List all installed skills
hatch update        # Update to latest skills
```

---

## Contributing

Skills are markdown files in `skills/`. If you want to add a skill, improve an existing one, or add support for a new contract type:

1. Fork the repo
2. Add or edit the skill file
3. Open a PR with a description of what it covers and what gap it fills

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide.

---

## Built on Base

Hatch is designed specifically for the Base ecosystem. Every default -- chain IDs, RPC endpoints, tooling choices, contract patterns -- is tuned for Base.

---

## License

MIT
