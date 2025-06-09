import * as z from "zod";

export const createWalletSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const unlockWalletSchema = z.object({
  password: z.string().min(8),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const sendTransactionSchema = z.object({
  toAddress: z.string().startsWith("0x"),
  amount: z.string().min(1),
});

export const sendTokenSchema = z.object({
  tokenAddress: z.string().startsWith("0x"),
  toAddress: z.string().startsWith("0x"),
  amount: z.string().min(1),
  password: z.string().min(8),
});

export const switchNetworkSchema = z.object({
  networkId: z.number().int().positive(),
});

export const getWalletDetailsSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
});

export const importWalletSchema = z
  .object({
    mnemonic: z
      .string()
      .min(1, "Mnemonic phrase is required")
      .refine(
        (mnemonic) => {
          const words = mnemonic.trim().split(/\s+/);
          return words.length === 12 || words.length === 24;
        },
        {
          message: "Mnemonic must be 12 or 24 words",
        }
      ),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const recoverWalletSchema = z
  .object({
    mnemonic: z
      .string()
      .min(1, "Mnemonic phrase is required")
      .refine(
        (mnemonic) => {
          const words = mnemonic.trim().split(/\s+/);
          return words.length === 12 || words.length === 24;
        },
        {
          message: "Mnemonic must be 12 or 24 words",
        }
      ),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must not exceed 128 characters"),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );
