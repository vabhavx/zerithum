import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LogOut, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { base44 } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import OTPVerification from "./OTPVerification";

export default function SignOutAllDevicesModal({ open, onOpenChange }) {
    const { user, logout } = useAuth();
    const [step, setStep] = useState("confirm"); // confirm, auth, otp
    const [currentPassword, setCurrentPassword] = useState("");

    // Check if user has password auth
    const hasPasswordAuth = user?.app_metadata?.provider === 'email' ||
        user?.app_metadata?.providers?.includes('email');

    // Send OTP mutation
    const sendOTPMutation = useMutation({
        mutationFn: () => base44.functions.invoke('sendVerificationCode', {
            purpose: 'revoke_sessions'
        }),
        onSuccess: () => {
            setStep("otp");
            toast.success("Verification code sent to your email");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to send verification code");
        }
    });

    // Revoke sessions mutation
    const revokeSessionsMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('revokeAllSessions', data),
        onSuccess: () => {
            toast.success("All sessions have been revoked");
            // Sign out locally and redirect
            logout(true);
        },
        onError: (error) => {
            if (error.requiresReauth && error.authMethod === 'otp') {
                sendOTPMutation.mutate();
            } else {
                toast.error(error.message || "Failed to revoke sessions");
            }
        }
    });

    const handleConfirm = () => {
        if (hasPasswordAuth) {
            setStep("auth");
        } else {
            sendOTPMutation.mutate();
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        revokeSessionsMutation.mutate({ currentPassword });
    };

    const handleOTPComplete = (code) => {
        revokeSessionsMutation.mutate({ verificationCode: code });
    };

    const handleClose = () => {
        setStep("confirm");
        setCurrentPassword("");
        onOpenChange(false);
    };

    const isLoading = revokeSessionsMutation.isPending || sendOTPMutation.isPending;

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-400/10 border border-orange-400/20 flex items-center justify-center">
                            <LogOut className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-white">Sign Out All Devices</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/40">
                                {step === "confirm" && "This will sign you out everywhere"}
                                {step === "auth" && "Verify your identity to continue"}
                                {step === "otp" && "Enter the verification code"}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                {step === "confirm" && (
                    <>
                        <div className="my-4 p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-orange-400 font-medium mb-1">This action will:</p>
                                    <ul className="text-white/60 space-y-1 list-disc list-inside">
                                        <li>Sign you out from all devices</li>
                                        <li>Invalidate all active sessions</li>
                                        <li>Require you to log in again</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <AlertDialogFooter>
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="border-white/10 text-white/60"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                Continue
                            </Button>
                        </AlertDialogFooter>
                    </>
                )}

                {step === "auth" && (
                    <form onSubmit={handlePasswordSubmit} className="mt-4">
                        <div className="space-y-2 mb-6">
                            <Label className="text-white/60">Current Password</Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                autoFocus
                            />
                        </div>

                        <AlertDialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep("confirm")}
                                className="border-white/10 text-white/60"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={!currentPassword || isLoading}
                                className="bg-orange-500 hover:bg-orange-600 text-white"
                            >
                                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Sign Out All Devices
                            </Button>
                        </AlertDialogFooter>
                    </form>
                )}

                {step === "otp" && (
                    <OTPVerification
                        email={user?.email}
                        purpose="revoke_sessions"
                        onComplete={handleOTPComplete}
                        onResend={() => sendOTPMutation.mutate()}
                        isLoading={isLoading}
                    />
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
