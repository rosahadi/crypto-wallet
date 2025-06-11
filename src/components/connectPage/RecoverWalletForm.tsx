"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Web3Card from "@/components/Web3Card";
import { useWallet } from "@/lib/hooks/useWallet";
import { importRecoverWalletSchema } from "@/lib/schemas";
import { ImportRecoverWalletFormData } from "@/lib/types";

interface RecoverWalletFormProps {
  onSetError: (error: string) => void;
}

export default function RecoverWalletForm({
  onSetError,
}: RecoverWalletFormProps) {
  const router = useRouter();
  const [showNewPassword, setShowNewPassword] =
    useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { importWallet, isAuthLoading } = useWallet();

  const form = useForm<ImportRecoverWalletFormData>({
    resolver: zodResolver(importRecoverWalletSchema),
    defaultValues: {
      mnemonic: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (
    data: ImportRecoverWalletFormData
  ) => {
    onSetError("");
    setIsSubmitting(true);

    try {
      const result = await importWallet(
        data.mnemonic.trim(),
        data.newPassword
      );

      if (result.success) {
        setTimeout(() => {
          router.push("/wallet");
        }, 100);
      } else {
        onSetError(
          result.message || "Failed to recover wallet"
        );
        setIsSubmitting(false);
      }
    } catch (err) {
      onSetError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred"
      );
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || isAuthLoading;

  return (
    <div className="space-y-6">
      {/* Information Card */}
      <Web3Card variant="crypto" glow>
        <div className="text-amber-300 text-sm">
          <strong>Forgot your password?</strong> Use your
          mnemonic phrase to regain access and set a new
          password. This will reset your current password.
        </div>
      </Web3Card>

      {/* Form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="mnemonic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200 font-medium">
                  Mnemonic Phrase
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter your mnemonic phrase separated by spaces"
                    className="bg-slate-900/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-200 placeholder-slate-400 min-h-[100px] font-mono backdrop-blur-sm transition-all duration-300"
                    rows={4}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="text-xs text-slate-500 mt-1">
                  Usually 12 or 24 words separated by spaces
                </div>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200 font-medium">
                  New Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Enter your new secure password"
                      className="bg-slate-900/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-200 placeholder-slate-400 pr-10 backdrop-blur-sm transition-all duration-300"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center hover:bg-slate-700/50 transition-colors duration-200"
                    onClick={() =>
                      setShowNewPassword(!showNewPassword)
                    }
                    disabled={isLoading}
                  >
                    {showNewPassword ? (
                      <EyeOffIcon
                        size={16}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-200"
                      />
                    ) : (
                      <EyeIcon
                        size={16}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-200"
                      />
                    )}
                  </Button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters
                </div>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200 font-medium">
                  Confirm New Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      placeholder="Confirm your new password"
                      className="bg-slate-900/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-200 placeholder-slate-400 pr-10 backdrop-blur-sm transition-all duration-300"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center hover:bg-slate-700/50 transition-colors duration-200"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon
                        size={16}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-200"
                      />
                    ) : (
                      <EyeIcon
                        size={16}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-200"
                      />
                    )}
                  </Button>
                </div>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white border-0 shadow-crypto-glow hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 font-medium py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Recovering...
                </span>
              </>
            ) : (
              <span className="text-white font-medium">
                Recover Wallet
              </span>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
