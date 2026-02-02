import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { base44 } from "@/api/supabaseClient";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/AuthContext";
import OTPVerification from "./OTPVerification";
import DopamineSuccess from "@/components/ui/DopamineSuccess";

export default function UpdatePasswordModal({ open, onOpenChange }) {
    const { user, logout } = useAuth();
    const [step, setStep] = useState("form"); // form, otp, success
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        verificationCode: ""
    });

    // Check if user signed up with password (has email provider)
    const hasPasswordAuth = user?.app_metadata?.provider === 'email' ||
        user?.app_metadata?.providers?.includes('email');

    // Password strength calculation
    const getPasswordStrength = (password) => {
        if (!password) return { score: 0, label: "", color: "" };

        let score = 0;
        if (password.length >= 12) score++;
        if (password.length >= 16) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;

        if (score >= 5) return { score, label: "Strong", color: "bg-emerald-500" };
        if (score >= 3) return { score, label: "Medium", color: "bg-yellow-500" };
        return { score, label: "Weak", color: "bg-red-500" };
    };

    const passwordStrength = getPasswordStrength(formData.newPassword);

    // Validation - ALWAYS require current password for password users
    const isPasswordValid = formData.newPassword.length >= 12;
    const passwordsMatch = formData.newPassword === formData.confirmPassword;
    // For password users: require current password
    // For OAuth users: they need OTP verification instead
    const hasCurrentAuth = hasPasswordAuth ? formData.currentPassword.length > 0 : true;
    const canSubmit = isPasswordValid && passwordsMatch && hasCurrentAuth;

    // Send OTP mutation (for OAuth users only)
    const sendOTPMutation = useMutation({
        mutationFn: () => base44.functions.invoke('sendVerificationCode', {
            purpose: 'password_change'
        }),
        onSuccess: () => {
            setStep("otp");
            toast.success("Verification code sent to your email");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to send verification code");
        }
    });

    // Update password mutation
    const updatePasswordMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('updatePassword', data),
        onSuccess: () => {
            setStep("success");
            toast.success("Password updated successfully");
            // Redirect to login after 2 seconds
            setTimeout(() => {
                logout(true);
            }, 2000);
        },
        onError: (error) => {
            if (error.requiresReauth && error.authMethod === 'otp') {
                // Need OTP verification (OAuth user)
                sendOTPMutation.mutate();
            } else {
                toast.error(error.message || "Failed to update password");
            }
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!canSubmit) return;

        if (hasPasswordAuth) {
            // Password users - submit with current password for verification
            updatePasswordMutation.mutate({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
        } else {
            // OAuth users - need OTP verification first
            sendOTPMutation.mutate();
        }
    };

    const handleOTPComplete = (code) => {
        updatePasswordMutation.mutate({
            verificationCode: code,
            newPassword: formData.newPassword
        });
    };

    const handleClose = () => {
        // Prevent closing during loading or success states
        if (isLoading || step === "success") return;

        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "", verificationCode: "" });
        setStep("form");
        onOpenChange(false);
    };

    const isLoading = updatePasswordMutation.isPending || sendOTPMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                className="bg-zinc-900 border-white/10 text-white max-w-md"
                onPointerDownOutside={(e) => {
                    // Prevent closing when clicking outside during loading
                    if (isLoading || step === "success") e.preventDefault();
                }}
                onEscapeKeyDown={(e) => {
                    // Prevent closing with Escape during loading
                    if (isLoading || step === "success") e.preventDefault();
                }}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
                            <KeyRound className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <DialogTitle className="text-white">Update Password</DialogTitle>
                            <DialogDescription className="text-white/40">
                                {step === "otp" ? "Enter the verification code" : "Change your account password"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                {step === "form" && (
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        {hasPasswordAuth && (
                            <div className="space-y-2">
                                <Label className="text-white/60">Current Password <span className="text-red-400">*</span></Label>
                                <div className="relative">
                                    <Input
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={formData.currentPassword}
                                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white pr-10"
                                        placeholder="Enter current password"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!hasPasswordAuth && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
                                Since you signed in with Google, we'll send a verification code to your email for security.
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-white/60">New Password <span className="text-red-400">*</span></Label>
                            <div className="relative">
                                <Input
                                    type={showNewPassword ? "text" : "password"}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white pr-10"
                                    placeholder="Minimum 12 characters"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                >
                                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {formData.newPassword && (
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all", passwordStrength.color)}
                                                style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                            />
                                        </div>
                                        <span className={cn(
                                            "text-xs font-medium",
                                            passwordStrength.score >= 5 ? "text-emerald-400" :
                                                passwordStrength.score >= 3 ? "text-yellow-400" : "text-red-400"
                                        )}>
                                            {passwordStrength.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-white/40">
                                        {isPasswordValid ? (
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        ) : (
                                            <X className="w-3 h-3 text-red-400" />
                                        )}
                                        At least 12 characters
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-white/60">Confirm New Password <span className="text-red-400">*</span></Label>
                            <div className="relative">
                                <Input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="bg-white/5 border-white/10 text-white pr-10"
                                    placeholder="Confirm new password"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {formData.confirmPassword && !passwordsMatch && (
                                <div className="flex items-center gap-1 text-xs text-red-400">
                                    <X className="w-3 h-3" />
                                    Passwords don't match
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-6">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="border-white/10 text-white/60"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={!canSubmit || isLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {hasPasswordAuth ? "Update Password" : "Continue"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {step === "otp" && (
                    <OTPVerification
                        email={user?.email}
                        purpose="password_change"
                        onComplete={handleOTPComplete}
                        onResend={() => sendOTPMutation.mutate()}
                        isLoading={isLoading}
                    />
                )}

                {step === "success" && (
                    <DopamineSuccess
                        title="Password Updated!"
                        message="You will be redirected to login with your new password."
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
