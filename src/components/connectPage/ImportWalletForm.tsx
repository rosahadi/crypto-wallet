"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Upload,
  Info,
} from "lucide-react";
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
import { useWallet } from "@/lib/hooks/useWallet";
import { ImportRecoverWalletFormData } from "@/lib/types";
import { importRecoverWalletSchema } from "@/lib/schemas";

interface ImportWalletFormProps {
  onSetError: (error: string) => void;
}

export default function ImportWalletForm({
  onSetError,
}: ImportWalletFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
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
          result.message || "Failed to import wallet"
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
      <div className="bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-500/30 rounded-xl p-4 backdrop-blur-sm shadow-blue-glow">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
          </div>
          <div className="flex-grow">
            <h3 className="text-base font-semibold text-blue-400 mb-1">
              Import Existing Wallet
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Enter your mnemonic phrase to restore your
              wallet with a new password. Your existing
              wallet will be imported and secured with the
              new password.
            </p>
          </div>
        </div>
      </div>

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
                <FormLabel className="text-slate-200 font-medium flex items-center space-x-2">
                  <Upload className="w-4 h-4 text-purple-400" />
                  <span>Mnemonic Phrase</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Enter your mnemonic phrase separated by spaces"
                    className="bg-slate-900/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-200 placeholder-slate-400 backdrop-blur-sm transition-all duration-300 min-h-[100px] font-mono resize-none"
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
                  New Wallet Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={
                        showPassword ? "text" : "password"
                      }
                      placeholder="Enter a secure password for this wallet"
                      className="bg-slate-900/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-200 placeholder-slate-400 pr-10 backdrop-blur-sm transition-all duration-300"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-slate-700/50 transition-colors duration-200"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff
                        size={16}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-200"
                      />
                    ) : (
                      <Eye
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
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-slate-700/50 transition-colors duration-200"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff
                        size={16}
                        className="text-slate-400 hover:text-purple-400 transition-colors duration-200"
                      />
                    ) : (
                      <Eye
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
                  Importing...
                </span>
              </>
            ) : (
              <span className="text-white font-medium">
                Import Wallet
              </span>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
