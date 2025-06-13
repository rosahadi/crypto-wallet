/**
 * Convert a value in wei (bigint) to a human-readable ether string
 * @param wei - The value in wei (1 ether = 10^18 wei)
 * @returns A string representing the ether value (e.g., "1.23")
 */
export function formatEther(
  value: bigint | string | number,
  decimals: number = 18
): string {
  try {
    const bigintValue =
      typeof value === "bigint" ? value : BigInt(value);
    const divisor = BigInt(10) ** BigInt(decimals);

    const quotient = bigintValue / divisor;
    const remainder = bigintValue % divisor;

    if (remainder === 0n) {
      return quotient.toString();
    }

    const remainderStr = remainder
      .toString()
      .padStart(decimals, "0");
    const trimmedRemainder = remainderStr.replace(
      /0+$/,
      ""
    );

    if (trimmedRemainder === "") {
      return quotient.toString();
    }

    return `${quotient}.${trimmedRemainder}`;
  } catch {
    return "0";
  }
}

/**
 * Convert a human-readable ether string into a bigint representing wei
 * @param etherStr - A string representing the ether value (e.g., "1.23")
 * @returns A bigint representing the equivalent value in wei
 */
export function parseEther(ethAmount: string): bigint {
  if (!ethAmount || ethAmount === "0") return BigInt(0);

  // Handle potential commas in input (e.g., "1,000.5")
  const cleanAmount = ethAmount.replace(/,/g, "");

  // Parse the decimal string
  const [integerPart, fractionalPart = ""] =
    cleanAmount.split(".");

  // Ensure the fractional part is exactly 18 digits (wei has 18 decimal places)
  const paddedFraction = fractionalPart
    .padEnd(18, "0")
    .slice(0, 18);

  // Combine integer and fractional parts
  // This implementation avoids the "leading zero bytes" issue
  return (
    BigInt(integerPart) * BigInt(10 ** 18) +
    BigInt(paddedFraction.padStart(18, "0"))
  );
}

/**
 * Converts a hex string to Uint8Array
 * @param hex - Hex string (without 0x prefix)
 * @returns Uint8Array of bytes
 */
function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error(
      "Hex string must have an even number of characters"
    );
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2);
    bytes[i] = parseInt(hexByte, 16);
  }

  return bytes;
}

/**
 * Converts a value to minimal representation bytes
 * @param value - Number or bigint to convert
 * @returns Minimal bytes representation (empty array for zero)
 */
export function toMinimalBytes(
  value: bigint | number
): Uint8Array {
  // Convert to bigint if it's a number
  const bigIntValue =
    typeof value === "number" ? BigInt(value) : value;

  // Special case for zero
  if (bigIntValue === BigInt(0)) {
    return new Uint8Array(0);
  }

  // Convert to hex without padding
  let hex = bigIntValue.toString(16);

  // Ensure even length for valid hex-to-bytes conversion
  if (hex.length % 2 !== 0) {
    hex = "0" + hex;
  }

  return hexToBytes(hex);
}

/**
 * Utility functions for formatting wallet data
 */

/**
 * Shortens an Ethereum address for display
 * @param {string} address - The full Ethereum address
 * @param {number} prefixLength - Number of characters to keep at the start (default: 6)
 * @param {number} suffixLength - Number of characters to keep at the end (default: 4)
 * @returns {string} Shortened address with ellipsis
 */
export const formatAddress = (
  address: string = "",
  prefixLength: number = 6,
  suffixLength: number = 4
): string => {
  if (!address || typeof address !== "string") return "";

  if (address.length <= prefixLength + suffixLength) {
    return address;
  }

  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);

  return `${prefix}...${suffix}`;
};

/**
 * Formats gas price from wei to a human-readable format
 * @param {string|number} gasPriceInWei - Gas price in wei
 * @param {string} unit - Target unit: 'gwei' or 'eth' (default: 'gwei')
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted gas price with unit
 */
export const formatGasPrice = (
  gasPriceInWei: string | number | undefined,
  unit: string = "gwei",
  decimals: number = 2
): string => {
  if (!gasPriceInWei) return "0 " + unit;

  // Convert to number
  const gasPrice =
    typeof gasPriceInWei === "string"
      ? parseFloat(gasPriceInWei)
      : gasPriceInWei;

  if (isNaN(gasPrice)) return "0 " + unit;

  let formattedPrice: string;

  if (unit.toLowerCase() === "gwei") {
    // 1 Gwei = 10^9 Wei
    formattedPrice = (gasPrice / 1e9).toFixed(decimals);
  } else if (unit.toLowerCase() === "eth") {
    // 1 ETH = 10^18 Wei
    formattedPrice = (gasPrice / 1e18).toFixed(decimals);
  } else {
    formattedPrice = gasPrice.toFixed(decimals);
  }

  formattedPrice = formattedPrice.replace(/\.?0+$/, "");
  if (formattedPrice.endsWith("."))
    formattedPrice = formattedPrice.slice(0, -1);

  return `${formattedPrice} ${unit}`;
};

export const formatTimestamp = (
  timestamp: number
): string => {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString();
};
