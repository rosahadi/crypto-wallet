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
import { changePasswordSchema } from "@/lib/schemas";
import { ChangePasswordFormData } from "@/lib/types";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ChangePasswordFormData) => void;
  isLoading: boolean;
  error: string | null;
}

export function ChangePasswordModal({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
  error,
}: ChangePasswordModalProps) {
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const form = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  function onSubmit(data: ChangePasswordFormData) {
    onConfirm(data);
  }

  const togglePasswordVisibility = (
    field: keyof typeof showPasswords
  ) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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
                <Lock className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
              Change Wallet Password
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">
              Update your wallet security credentials
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
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-400" />
                      Current Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={
                            showPasswords.current
                              ? "text"
                              : "password"
                          }
                          disabled={isLoading}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 
                                   focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 
                                   hover:border-slate-500/60 transition-all duration-200 pr-10
                                   backdrop-blur-sm"
                          placeholder="Enter current password"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility(
                              "current"
                            )
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                   text-slate-400 hover:text-slate-300 transition-colors duration-200"
                          disabled={isLoading}
                        >
                          {showPasswords.current ? (
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

              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={
                            showPasswords.new
                              ? "text"
                              : "password"
                          }
                          disabled={isLoading}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 
                                   focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 
                                   hover:border-slate-500/60 transition-all duration-200 pr-10
                                   backdrop-blur-sm"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility("new")
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                   text-slate-400 hover:text-slate-300 transition-colors duration-200"
                          disabled={isLoading}
                        >
                          {showPasswords.new ? (
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

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-400" />
                      Confirm New Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={
                            showPasswords.confirm
                              ? "text"
                              : "password"
                          }
                          disabled={isLoading}
                          className="bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 
                                   focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 
                                   hover:border-slate-500/60 transition-all duration-200 pr-10
                                   backdrop-blur-sm"
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            togglePasswordVisibility(
                              "confirm"
                            )
                          }
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                   text-slate-400 hover:text-slate-300 transition-colors duration-200"
                          disabled={isLoading}
                        >
                          {showPasswords.confirm ? (
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

              <DialogFooter className="flex justify-end gap-3 pt-6">
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
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 
                           hover:to-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-lg hover:shadow-emerald-500/25 transition-all duration-200
                           font-medium px-6"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Updating...
                    </div>
                  ) : (
                    "Update Password"
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
