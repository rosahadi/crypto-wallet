"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2,
  Plus,
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
import { createWalletSchema } from "@/lib/schemas";
import { useWallet } from "@/lib/hooks/useWallet";
import { CreateWalletFormData } from "@/lib/types";

interface CreateWalletFormProps {
  onSetError: (error: string) => void;
  onSetGeneratedMnemonic: (mnemonic: string) => void;
}

export default function CreateWalletForm({
  onSetError,
  onSetGeneratedMnemonic,
}: CreateWalletFormProps) {
  const [showCreatePassword, setShowCreatePassword] =
    useState(false);
  const [
    showConfirmCreatePassword,
    setShowConfirmCreatePassword,
  ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createWallet } = useWallet();

  const createForm = useForm<CreateWalletFormData>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onCreateSubmit = async (
    data: CreateWalletFormData
  ) => {
    onSetError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    try {
      const result = await createWallet(data.password);

      if (result.success) {
        if (
          result.data &&
          typeof result.data === "object" &&
          "mnemonic" in result.data
        ) {
          onSetGeneratedMnemonic(
            result.data.mnemonic as string
          );
        }

        if (
          result.data &&
          typeof result.data === "object" &&
          "address" in result.data
        ) {
          sessionStorage.setItem(
            "wallet_address",
            result.data.address as string
          );
        }
      } else {
        onSetError(
          result.message || "Failed to create wallet"
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

  const isLoading = isSubmitting;

  return (
    <Form {...createForm}>
      <form
        onSubmit={createForm.handleSubmit(onCreateSubmit)}
        className="space-y-6"
      >
        <FormField
          control={createForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200 font-medium">
                Password
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={
                      showCreatePassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Enter a secure password"
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
                    setShowCreatePassword(
                      !showCreatePassword
                    )
                  }
                  disabled={isLoading}
                >
                  {showCreatePassword ? (
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

        <FormField
          control={createForm.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200 font-medium">
                Confirm Password
              </FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    {...field}
                    type={
                      showConfirmCreatePassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
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
                    setShowConfirmCreatePassword(
                      !showConfirmCreatePassword
                    )
                  }
                  disabled={isLoading}
                >
                  {showConfirmCreatePassword ? (
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
                Creating...
              </span>
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4 text-white" />
              <span className="text-white font-medium">
                Create Wallet
              </span>
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
