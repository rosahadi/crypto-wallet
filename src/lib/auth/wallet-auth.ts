import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";
import {
  encryptData,
  decryptData,
} from "@/lib/utils/encryption";
import { StoredWallet } from "../types/wallet";

// In-memory fallback storage (for environments without localStorage)
class StorageManager {
  private storage: Map<string, string> = new Map();

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  getItem(key: string): string | null {
    return this.storage.get(key) || null;
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

const storage =
  typeof localStorage !== "undefined"
    ? localStorage
    : new StorageManager();

/**
 * Encrypts and stores wallet data in local storage.
 * @param mnemonic - The wallet mnemonic.
 * @param password - The password for encryption.
 * @param address - The wallet address.
 * @returns The stored wallet object.
 */
export async function storeWalletData(
  mnemonic: string,
  password: string,
  address: string
): Promise<StoredWallet> {
  const timestamp = Date.now();

  const walletData: StoredWallet = {
    address: address.toLowerCase(),
    encryptedMnemonic: await encryptData(
      mnemonic,
      password
    ),
    createdAt: timestamp,
    lastAccessAt: timestamp,
  };

  storage.setItem(
    "wallet_data",
    JSON.stringify(walletData)
  );
  return walletData;
}

/**
 * Retrieves and decrypts stored wallet data.
 * @param password - The password to decrypt the mnemonic.
 * @returns The wallet data and mnemonic or null if decryption fails.
 */
export async function getStoredWalletData(
  password: string
): Promise<{
  walletData: StoredWallet;
  mnemonic: string;
} | null> {
  try {
    const walletDataJson = storage.getItem("wallet_data");
    if (!walletDataJson) return null;

    const walletData = JSON.parse(
      walletDataJson
    ) as StoredWallet;
    const mnemonic = await decryptData(
      walletData.encryptedMnemonic,
      password
    );
    if (!mnemonic) return null;

    walletData.lastAccessAt = Date.now();
    storage.setItem(
      "wallet_data",
      JSON.stringify(walletData)
    );
    return { walletData, mnemonic };
  } catch {
    return null;
  }
}

/**
 * Updates stored wallet data, used for password or mnemonic changes.
 * @param address - Wallet address.
 * @param mnemonic - New mnemonic.
 * @param password - New password.
 */
export async function updateWalletData(
  address: string,
  mnemonic: string,
  password: string
): Promise<void> {
  const existingDataJson = storage.getItem("wallet_data");
  let createdAt = Date.now();

  if (existingDataJson) {
    try {
      const existingData = JSON.parse(
        existingDataJson
      ) as StoredWallet;
      createdAt = existingData.createdAt;
    } catch {}
  }

  const walletData: StoredWallet = {
    address: address.toLowerCase(),
    encryptedMnemonic: await encryptData(
      mnemonic,
      password
    ),
    createdAt,
    lastAccessAt: Date.now(),
  };

  storage.setItem(
    "wallet_data",
    JSON.stringify(walletData)
  );
}

/**
 * Validates if wallet data exists and can be decrypted.
 * @param password - Password to validate decryption.
 * @returns True if wallet is valid, false otherwise.
 */
export async function validateWalletIntegrity(
  password: string
): Promise<boolean> {
  try {
    const result = await getStoredWalletData(password);
    return !!result;
  } catch {
    return false;
  }
}

/**
 * Checks if wallet data is stored.
 * @returns True if wallet data exists.
 */
export function hasStoredWallet(): boolean {
  return !!storage.getItem("wallet_data");
}

/**
 * Returns wallet info without requiring the password.
 * @returns Basic wallet info for UI.
 */
export function getWalletInfo(): {
  hasWallet: boolean;
  address?: string;
  createdAt?: number;
} {
  const walletDataJson = storage.getItem("wallet_data");
  if (!walletDataJson) {
    return { hasWallet: false };
  }

  try {
    const walletData = JSON.parse(
      walletDataJson
    ) as StoredWallet;
    return {
      hasWallet: true,
      address: walletData.address,
      createdAt: walletData.createdAt,
    };
  } catch {
    return { hasWallet: false };
  }
}

/**
 * Removes stored wallet data.
 */
export function deleteWalletFromStorage(): void {
  storage.removeItem("wallet_data");
}

/**
 * Signs a message with a given private key.
 * @param message - The message to sign.
 * @param privateKey - The private key as a Uint8Array.
 * @returns The signature in hex format.
 */
export function signMessage(
  message: string,
  privateKey: Uint8Array
): string {
  const messageHash = keccak_256(
    new TextEncoder().encode(message)
  );
  const signature = secp256k1.sign(messageHash, privateKey);
  return `0x${bytesToHex(signature.toCompactRawBytes())}`;
}

/**
 * Verifies a signature against a message and an expected address.
 * @param message - The original signed message.
 * @param signature - The hex signature.
 * @param expectedAddress - The expected Ethereum address.
 * @returns True if the signature is valid.
 */
export function verifySignature(
  message: string,
  signature: string,
  expectedAddress: string
): boolean {
  try {
    const messageHash = keccak_256(
      new TextEncoder().encode(message)
    );
    const sigBytes = new Uint8Array(
      Buffer.from(signature.slice(2), "hex")
    );

    for (let recoveryId = 0; recoveryId < 4; recoveryId++) {
      try {
        const publicKey = secp256k1.Signature.fromCompact(
          sigBytes
        )
          .addRecoveryBit(recoveryId)
          .recoverPublicKey(messageHash);

        const addressBytes = keccak_256(
          publicKey.toRawBytes(false).slice(1)
        ).slice(-20);
        const recoveredAddress =
          "0x" + bytesToHex(addressBytes);

        if (
          recoveredAddress.toLowerCase() ===
          expectedAddress.toLowerCase()
        ) {
          return true;
        }
      } catch {
        continue;
      }
    }
    return false;
  } catch {
    return false;
  }
}
