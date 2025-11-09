// util.ts
// Ensure strict string typing to satisfy eslint @typescript-eslint/no-unsafe-assignment
export const rpcUrl: string = String(import.meta.env.PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org');

export const networkPassphrase: string = String(import.meta.env.VITE_NETWORK_PASSPHRASE || 'Test SDF Network ; September 2015');

// Add any other utility functions or constants you need