# Crypto Wallet Service

Secure TypeScript wallet service for Ethereum networks with encrypted storage and session management.

## What it does

- Create and manage HD wallets with BIP39 mnemonics
- Send ETH and ERC-20 tokens with automatic gas estimation
- Store wallet data encrypted with password protection
- Handle sessions with automatic timeout and validation
- Support multiple Ethereum-compatible networks

## Security

- AES-256 encryption for stored data
- Session expires after 2 hours of inactivity
- Automatic memory cleanup
- Integrity validation on wallet data

## Components

- **WalletService** - Main API
- **Authentication Store** - Session management with Zustand
- **Network Support** - Multi-chain compatibility

## License

MIT
