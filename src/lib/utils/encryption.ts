import { argon2id } from "@noble/hashes/argon2";
import { randomBytes } from "@noble/hashes/utils";

/**
 * Encrypts plaintext using Argon2id-derived key and AES-256-GCM.
 *
 * @param data - Plaintext string to encrypt
 * @param password - Password used to derive the encryption key
 * @returns Base64-encoded string containing salt, IV, and ciphertext
 */
export async function encryptData(
  data: string,
  password: string
): Promise<string> {
  const salt = randomBytes(16);

  const key = argon2id(password, salt, {
    m: 65536,
    t: 3,
    p: 4,
    dkLen: 32,
  });

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    new TextEncoder().encode(data)
  );

  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(
    new Uint8Array(encrypted),
    salt.length + iv.length
  );

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts Base64-encoded AES-GCM-encrypted data previously encrypted with `encryptData`.
 *
 * @param encryptedData - Base64-encoded string with salt, IV, and ciphertext
 * @param password - Password used during encryption
 * @returns Decrypted plaintext string
 * @throws If decryption fails due to incorrect password or corrupted data
 */
export async function decryptData(
  encryptedData: string,
  password: string
): Promise<string> {
  try {
    if (
      !encryptedData ||
      typeof encryptedData !== "string"
    ) {
      throw new Error("Invalid encrypted data format");
    }

    const combined = new Uint8Array(
      atob(encryptedData)
        .split("")
        .map((c) => c.charCodeAt(0))
    );

    if (combined.length < 29) {
      throw new Error(
        "Encrypted data is too short or corrupted"
      );
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    const key = argon2id(password, salt, {
      m: 65536,
      t: 3,
      p: 4,
      dkLen: 32,
    });

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === "OperationError"
    ) {
      throw new Error(
        "Decryption failed. Incorrect password or corrupted data."
      );
    }
    throw new Error(
      "Decryption failed. Incorrect password or corrupted data."
    );
  }
}
