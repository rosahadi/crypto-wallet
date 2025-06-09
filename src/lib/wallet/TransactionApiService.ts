import { secp256k1 } from "@noble/curves/secp256k1";
import { keccak_256 } from "@noble/hashes/sha3";
import {
  bytesToHex as nobleHex,
  hexToBytes as nobleBytes,
  concatBytes as nobleConcat,
} from "@noble/hashes/utils";
import { RLP } from "@ethereumjs/rlp";
import {
  toMinimalBytes,
  formatEther,
} from "../utils/index";
import { BaseService } from "./BaseService";
import {
  FeeData,
  TransactionParams,
} from "../types/wallet";

export class TransactionService extends BaseService {
  private chainId: number;

  constructor(rpcUrl: string, chainId: number = 11155111) {
    super(rpcUrl);
    this.chainId = chainId;
  }

  /**
   * Gets the current gas price
   */
  async getGasPrice(): Promise<bigint> {
    return BigInt(
      await this.callRPC<string>("eth_gasPrice")
    );
  }

  /**
   * Gets fee data for EIP-1559 transactions
   */
  async getFeeData(): Promise<FeeData> {
    try {
      const feeHistory = await this.callRPC<{
        baseFeePerGas: string[];
        gasUsedRatio: number[];
        oldestBlock: string;
        reward: string[][];
      }>("eth_feeHistory", [4, "latest", [25, 75]]);

      const baseFee = BigInt(feeHistory.baseFeePerGas[0]);
      const priorityFee = BigInt(feeHistory.reward[0][1]);
      const maxFeePerGas =
        (baseFee * BigInt(120)) / BigInt(100) + priorityFee;

      return {
        maxFeePerGas,
        maxPriorityFeePerGas: priorityFee,
      };
    } catch {
      const gasPrice = await this.getGasPrice();
      return {
        maxFeePerGas: gasPrice,
        maxPriorityFeePerGas: gasPrice / BigInt(2),
      };
    }
  }

  /**
   * Estimates gas for a transaction
   */
  async estimateGas(
    from: string,
    to: string,
    value: bigint,
    data: string = "0x"
  ): Promise<bigint> {
    try {
      const gasEstimate = await this.callRPC<string>(
        "eth_estimateGas",
        [
          {
            from,
            to,
            value: `0x${value.toString(16)}`,
            data,
          },
        ]
      );

      return (
        (BigInt(gasEstimate) * BigInt(120)) / BigInt(100)
      );
    } catch {
      return data !== "0x" && data !== ""
        ? BigInt(100000)
        : BigInt(21000);
    }
  }

  /**
   * Gets the next nonce for an address
   */
  async getNextNonce(address: string): Promise<number> {
    const nonceHex = await this.callRPC<string>(
      "eth_getTransactionCount",
      [address.toLowerCase(), "latest"]
    );

    return parseInt(nonceHex, 16);
  }

  /**
   * Gets the balance of an address
   */
  async getBalance(address: string): Promise<bigint> {
    const balanceHex = await this.callRPC<string>(
      "eth_getBalance",
      [address.toLowerCase(), "latest"]
    );

    return BigInt(balanceHex);
  }

  /**
   * Creates an EIP-1559 transaction
   */
  async createEIP1559Transaction(
    privateKey: Uint8Array,
    fromAddress: string,
    params: TransactionParams
  ): Promise<string> {
    const {
      to,
      value,
      data = "0x",
      gasLimit,
      nonce,
      maxFeePerGas,
      maxPriorityFeePerGas,
    } = params;

    const feeData = await this.getFeeData();
    const actualMaxFeePerGas =
      maxFeePerGas || feeData.maxFeePerGas;
    const actualMaxPriorityFeePerGas =
      maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
    const actualGasLimit =
      gasLimit ||
      (await this.estimateGas(
        fromAddress,
        to.toLowerCase(),
        value,
        data
      ));
    const actualNonce =
      nonce !== undefined
        ? nonce
        : await this.getNextNonce(fromAddress);

    const chainIdBytes = toMinimalBytes(
      BigInt(this.chainId)
    );
    const nonceBytes = toMinimalBytes(BigInt(actualNonce));
    const maxPriorityFeePerGasBytes = toMinimalBytes(
      actualMaxPriorityFeePerGas
    );
    const maxFeePerGasBytes = toMinimalBytes(
      actualMaxFeePerGas
    );
    const gasLimitBytes = toMinimalBytes(actualGasLimit);
    const recipientBytes = nobleBytes(
      to.startsWith("0x") ? to.slice(2) : to
    );
    const valueBytes = toMinimalBytes(value);
    const dataBytes = nobleBytes(
      data.startsWith("0x") ? data.slice(2) : data
    );

    const txPayload = [
      chainIdBytes,
      nonceBytes,
      maxPriorityFeePerGasBytes,
      maxFeePerGasBytes,
      gasLimitBytes,
      recipientBytes,
      valueBytes,
      dataBytes,
      [],
    ];

    const encodedTx = RLP.encode(txPayload);
    const txType = new Uint8Array([0x02]);
    const typedTx = nobleConcat(txType, encodedTx);
    const txHash = keccak_256(typedTx);
    const signature = secp256k1.sign(txHash, privateKey);

    const r = signature.r;
    const s = signature.s;
    const recovery = signature.recovery!;

    const rBytes = toMinimalBytes(r);
    const sBytes = toMinimalBytes(s);
    const yParity = toMinimalBytes(BigInt(recovery));

    const signedPayload = [
      chainIdBytes,
      nonceBytes,
      maxPriorityFeePerGasBytes,
      maxFeePerGasBytes,
      gasLimitBytes,
      recipientBytes,
      valueBytes,
      dataBytes,
      [],
      yParity,
      rBytes,
      sBytes,
    ];

    const signedEncodedTx = RLP.encode(signedPayload);
    const signedTypedTx = nobleConcat(
      txType,
      signedEncodedTx
    );

    return `0x${nobleHex(signedTypedTx)}`;
  }

  /**
   * Validates if there are sufficient funds for a transaction
   */
  async validateFunds(
    address: string,
    value: bigint,
    gasLimit?: bigint,
    maxFeePerGas?: bigint
  ): Promise<void> {
    const balance = await this.getBalance(address);
    const feeData = await this.getFeeData();
    const actualMaxFeePerGas =
      maxFeePerGas || feeData.maxFeePerGas;
    const actualGasLimit = gasLimit || BigInt(21000);
    const totalMaxCost =
      value + actualMaxFeePerGas * actualGasLimit;

    if (balance < totalMaxCost) {
      const shortfall = totalMaxCost - balance;
      throw new Error(
        `Insufficient funds:\n` +
          `  Available: ${formatEther(balance)} ETH\n` +
          `  Required (max): ${formatEther(
            totalMaxCost
          )} ETH\n` +
          `  Shortfall: ${formatEther(shortfall)} ETH\n` +
          `Please fund your account at ${address}`
      );
    }
  }

  /**
   * Sends a raw transaction to the network
   */
  async sendRawTransaction(
    signedTx: string
  ): Promise<string> {
    try {
      return this.callRPC<string>(
        "eth_sendRawTransaction",
        [signedTx]
      );
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to send transaction: ${error.message}`
        );
      }
      throw new Error("Failed to send transaction");
    }
  }
}
