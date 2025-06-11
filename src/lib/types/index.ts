import * as z from "zod";
import {
  createWalletSchema,
  unlockWalletSchema,
  changePasswordSchema,
  sendTransactionSchema,
  sendTokenSchema,
  switchNetworkSchema,
  getWalletDetailsSchema,
  importRecoverWalletSchema,
} from "../schemas";

export type CreateWalletFormData = z.infer<
  typeof createWalletSchema
>;
export type UnlockWalletFormData = z.infer<
  typeof unlockWalletSchema
>;
export type ChangePasswordFormData = z.infer<
  typeof changePasswordSchema
>;
export type SendTransactionFormData = z.infer<
  typeof sendTransactionSchema
>;
export type SendTokenFormData = z.infer<
  typeof sendTokenSchema
>;
export type SwitchNetworkFormData = z.infer<
  typeof switchNetworkSchema
>;
export type GetWalletDetailsFormData = z.infer<
  typeof getWalletDetailsSchema
>;
export type ImportRecoverWalletFormData = z.infer<
  typeof importRecoverWalletSchema
>;
