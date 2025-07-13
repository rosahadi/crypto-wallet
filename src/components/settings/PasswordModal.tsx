import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/Alert";
import { passwordSchema } from "@/lib/schemas";
import { PasswordSchemaFormData } from "@/lib/types";

interface PasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: PasswordSchemaFormData) => void;
  isLoading: boolean;
  error: string | null;
}

export function PasswordModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  error,
}: PasswordModalProps) {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<PasswordSchemaFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: "",
    },
  });

  function onSubmit(data: PasswordSchemaFormData) {
    onConfirm(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gradient-to-br from-slate-900/95 to-purple-900/30 border border-purple-500/30 backdrop-blur-md text-white sm:max-w-md shadow-crypto-glow">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5 rounded-lg overflow-hidden">
          <div
            className="w-full h-full animate-pulse"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(139, 92, 246, 0.3) 1px, transparent 0)`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="relative z-10">
          <DialogHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-purple-500/20 border border-purple-500/30 shadow-purple-glow">
                <Shield className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Wallet Authentication
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              Enter your wallet password to access sensitive
              details
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mb-4">
              <Alert
                message={error}
                variant="error"
                dismissible={false}
                className="animate-fadeIn"
              />
            </div>
          )}

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
                    <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-purple-400" />
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          disabled={isLoading}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 
                                   focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                   hover:border-slate-500/60 transition-all duration-200 pr-10
                                   backdrop-blur-sm"
                          placeholder="Enter your password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(!showPassword)
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                   text-slate-400 hover:text-slate-300 transition-colors duration-200"
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400 text-sm" />
                  </FormItem>
                )}
              />

              <DialogFooter className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="text-slate-300 border-slate-600/50 hover:bg-slate-800/50 
                           hover:border-slate-500/60 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isLoading || !form.formState.isValid
                  }
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 
                           hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg hover:shadow-purple-500/25 transition-all duration-200
                           font-medium px-6"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    "Authenticate"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
