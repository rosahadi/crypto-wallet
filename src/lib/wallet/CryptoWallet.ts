import {
  generateMnemonic,
  mnemonicToEntropy,
  validateMnemonic,
} from "ethereum-cryptography/bip39";
import { wordlist } from "ethereum-cryptography/bip39/wordlists/english";
import { HDKey } from "ethereum-cryptography/hdkey";
import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex as nobleHex } from "@noble/hashes/utils";
import axios from "axios";
import {
  RawTransaction,
  TransactionData,
} from "../types/wallet";
import { BaseService } from "./BaseService";

export class CryptoWallet extends BaseService {
  private privateKey: Uint8Array | null = null;
  private publicKey: Uint8Array | null = null;
  private address: string = "";
  private mnemonic: string = "";
  private hdRootKey: HDKey | null = null;
  private explorerApiUrl: string = "";
  private explorerApiKey: string = "";
  private chainId: number = 11155111;

  constructor(
    rpcUrl: string,
    explorerApiUrl: string = "",
    explorerApiKey: string = "",
    chainId: number = 11155111
  ) {
    super(rpcUrl);
    this.explorerApiUrl = explorerApiUrl;
    this.explorerApiKey = explorerApiKey;
    this.chainId = chainId;
  }

  getAddress(): string {
    return this.address;
  }

  isInitialized(): boolean {
    return !!this.privateKey && !!this.address;
  }

  importFromMnemonic(mnemonic: string): string {
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new Error("Invalid mnemonic");
    }

    this.mnemonic = mnemonic;
    const entropy = mnemonicToEntropy(mnemonic, wordlist);
    const hdKey = HDKey.fromMasterSeed(entropy);
    this.hdRootKey = hdKey;

    const childKey = hdKey.derive("m/44'/60'/0'/0/0");

    if (!childKey.privateKey) {
      throw new Error("Failed to derive private key");
    }

    const publicKey = secp256k1.getPublicKey(
      childKey.privateKey,
      false
    );
    const addressBytes = keccak_256(
      publicKey.slice(1)
    ).slice(-20);
    const address = "0x" + nobleHex(addressBytes);

    this.privateKey = childKey.privateKey;
    this.publicKey = publicKey;
    this.address = address.toLowerCase();

    return this.address;
  }

  generateWallet(strength: number = 256): string {
    const mnemonic = generateMnemonic(wordlist, strength);
    this.mnemonic = mnemonic;

    const entropy = mnemonicToEntropy(mnemonic, wordlist);
    const hdKey = HDKey.fromMasterSeed(entropy);
    this.hdRootKey = hdKey;

    const childKey = hdKey.derive("m/44'/60'/0'/0/0");

    if (!childKey.privateKey) {
      throw new Error("Failed to derive private key");
    }

    const publicKey = secp256k1.getPublicKey(
      childKey.privateKey,
      false
    );
    const addressBytes = keccak_256(
      publicKey.slice(1)
    ).slice(-20);
    const address = "0x" + nobleHex(addressBytes);

    this.privateKey = childKey.privateKey;
    this.publicKey = publicKey;
    this.address = address.toLowerCase();

    return mnemonic;
  }

  clearWallet(): void {
    if (this.privateKey) {
      crypto.getRandomValues(this.privateKey);
      this.privateKey = null;
    }
    this.publicKey = null;
    this.address = "";
    this.mnemonic = "";
    this.hdRootKey = null;
  }

  async getBalance(address?: string): Promise<bigint> {
    const targetAddress = address || this.address;
    if (!targetAddress) {
      throw new Error(
        "No address specified and wallet not initialized"
      );
    }

    const balanceHex = await this.callRPC<string>(
      "eth_getBalance",
      [targetAddress.toLowerCase(), "latest"]
    );

    return BigInt(balanceHex);
  }

  async getTransactions(
    address?: string
  ): Promise<TransactionData[]> {
    const targetAddress = address || this.address;
    if (!targetAddress) {
      throw new Error(
        "No address specified and wallet not initialized"
      );
    }

    if (!this.explorerApiUrl) {
      throw new Error("Explorer API URL not set");
    }

    try {
      const apiKey = this.explorerApiKey || "";
      const url = `${this.explorerApiUrl}/api?module=account&action=txlist&address=${targetAddress}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`;

      const response = await axios.get(url);

      if (response.data.status !== "1") {
        return [];
      }

      if (!Array.isArray(response.data.result)) {
        return [];
      }

      return response.data.result.map(
        (tx: RawTransaction) => {
          let status: "pending" | "success" | "failed";

          if (tx.txreceipt_status === "") {
            status = "pending";
          } else if (
            tx.isError === "0" &&
            tx.txreceipt_status === "1"
          ) {
            status = "success";
          } else {
            status = "failed";
          }

          return {
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value: tx.value,
            timestamp: parseInt(tx.timeStamp),
            gasUsed: tx.gasUsed,
            gasPrice: tx.gasPrice,
            nonce: parseInt(tx.nonce),
            data: tx.input !== "0x" ? tx.input : undefined,
            status,
            isIncoming:
              tx.to.toLowerCase() ===
              targetAddress.toLowerCase(),
          };
        }
      );
    } catch {
      return [];
    }
  }

  getPrivateKey(): Uint8Array {
    if (!this.privateKey) {
      throw new Error("Wallet not initialized");
    }
    return this.privateKey;
  }

  getPrivateKeyHex(): string {
    if (!this.privateKey) {
      throw new Error("Wallet not initialized");
    }

    return `0x${nobleHex(this.privateKey)}`;
  }

  getPublicKeyHex(): string {
    if (!this.publicKey) {
      throw new Error("Wallet not initialized");
    }

    return `0x${nobleHex(this.publicKey)}`;
  }
}
