"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  EyeIcon,
  EyeOffIcon,
  Loader2,
  Unlock,
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
import { unlockWalletSchema } from "@/lib/schemas";
import { useWallet } from "@/lib/hooks/useWallet";
import { z } from "zod";
import { UnlockWalletFormData } from "@/lib/types";

interface UnlockWalletFormProps {
  onSetError: (error: string) => void;
}

export default function UnlockWalletForm({
  onSetError,
}: UnlockWalletFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { unlockWallet } = useWallet();

  const form = useForm<UnlockWalletFormData>({
    resolver: zodResolver(unlockWalletSchema),
    defaultValues: {
      password: "",
    },
  });

  const onSubmit = async (data: UnlockWalletFormData) => {
    onSetError("");
    setIsSubmitting(true);

    await new Promise((resolve) => setTimeout(resolve, 10));

    try {
      const result = await unlockWallet(data.password);

      if (result.success) {
        setTimeout(() => {
          router.push("/wallet");
        }, 100);
      } else {
        onSetError(
          result.message || "Failed to unlock wallet"
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

    console.timeEnd("unlock-process");
  };

  const isLoading = isSubmitting;

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200 font-medium">
                  Wallet Password
                </FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input
                      {...field}
                      type={
                        showPassword ? "text" : "password"
                      }
                      placeholder="Enter your wallet password"
                      className="bg-slate-900/50 border-slate-700/50 focus:border-purple-500/50 focus:ring-purple-500/20 text-slate-200 placeholder-slate-400 pr-10 backdrop-blur-sm transition-all duration-300"
                      autoComplete="current-password"
                      disabled={isLoading}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center hover:bg-slate-700/50 transition-colors duration-200"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={isLoading}
                  >
                    {showPassword ? (
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
                  Unlocking...
                </span>
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4 text-white" />
                <span className="text-white font-medium">
                  Unlock Wallet
                </span>
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
