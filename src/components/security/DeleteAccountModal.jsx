import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2, Loader2, AlertTriangle, AlertOctagon, CheckCircle2, XCircle } from "lucide-react";
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

export default function DeleteAccountModal({ open, onOpenChange }) {
    const { user, logout } = useAuth();
    const [step, setStep] = useState("warning"); // warning, confirm_text, auth, otp, processing, success, failure
    const [confirmationText, setConfirmationText] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Check if user has password auth
    const hasPasswordAuth = user?.app_metadata?.provider === 'email' ||
        user?.app_metadata?.providers?.includes('email');

    // Send OTP mutation
    const sendOTPMutation = useMutation({
        mutationFn: () => base44.functions.invoke('sendVerificationCode', {
            purpose: 'delete_account'
        }),
        onSuccess: () => {
            setStep("otp");
            toast.success("Verification code sent to your email");
        },
        onError: (error) => {
            toast.error(error.message || "Failed to send verification code");
        }
    });

    // Delete account mutation
    const deleteAccountMutation = useMutation({
        mutationFn: (data) => base44.functions.invoke('deleteAccount', data),
        onSuccess: () => {
            setStep("success");
            // Redirect handled in success view
        },
        onError: (error) => {
            if (error.requiresReauth && error.authMethod === 'otp') {
                sendOTPMutation.mutate();
            } else {
                setErrorMsg(error.message || "Failed to delete account");
                setStep("failure");
            }
        }
    });

    const handleConfirmText = (e) => {
        e.preventDefault();
        if (confirmationText !== "DELETE") return;

        if (hasPasswordAuth) {
            setStep("auth");
        } else {
            sendOTPMutation.mutate();
        }
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setStep("processing");
        deleteAccountMutation.mutate({
            confirmationText: "DELETE",
            currentPassword
        });
    };

    const handleOTPComplete = (code) => {
        setStep("processing");
        deleteAccountMutation.mutate({
            confirmationText: "DELETE",
            verificationCode: code
        });
    };

    const handleClose = () => {
        // Prevent closing during processing or success (unless forcing via redirect)
        if (step === "processing" || step === "success") return;

        setStep("warning");
        setConfirmationText("");
        setCurrentPassword("");
        setErrorMsg("");
        onOpenChange(false);
    };

    const handleFinalExit = () => {
        logout(true);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="bg-zinc-900 border-red-500/20 text-white max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                            {step === "processing" ? (
                                <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                            ) : (
                                <Trash2 className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                        <div>
                            <AlertDialogTitle className="text-white">Delete Account</AlertDialogTitle>
                            <AlertDialogDescription className="text-white/40">
                                {step === "warning" && "Warning: This action is irreversible"}
                                {step === "confirm_text" && "Type DELETE to confirm"}
                                {step === "auth" && "Verify your identity"}
                                {step === "otp" && "Enter verification code"}
                                {step === "processing" && "Deleting your data..."}
                                {step === "success" && "Account deleted"}
                                {step === "failure" && "Deletion failed"}
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                {step === "warning" && (
                    <>
                        <div className="my-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="text-red-400 font-medium mb-1">Permanent Data Loss</p>
                                    <p className="text-white/60 mb-2">
                                        This will permanently delete your account and all associated data, including:
                                    </p>
                                    <ul className="text-white/60 space-y-1 list-disc list-inside text-xs">
                                        <li>Platform connections & OAuth tokens</li>
                                        <li>Transaction history & revenue data</li>
                                        <li>Expense records & receipts</li>
                                        <li>Tax profiles & reports</li>
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
                                onClick={() => setStep("confirm_text")}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Continue
                            </Button>
                        </AlertDialogFooter>
                    </>
                )}

                {step === "confirm_text" && (
                    <form onSubmit={handleConfirmText} className="mt-4">
                        <div className="space-y-4 mb-6">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                                <p className="text-sm text-white/80">
                                    Please type <span className="font-mono font-bold text-red-400 select-all">DELETE</span> below to confirm you understand the consequences.
                                </p>
                            </div>

                            <Input
                                value={confirmationText}
                                onChange={(e) => setConfirmationText(e.target.value)}
                                className="bg-white/5 border-white/10 text-white font-mono text-center tracking-widest uppercase"
                                placeholder=""
                                autoFocus
                            />
                        </div>

                        <AlertDialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep("warning")}
                                className="border-white/10 text-white/60"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={confirmationText !== "DELETE"}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Verify & Delete
                            </Button>
                        </AlertDialogFooter>
                    </form>
                )}

                {step === "auth" && (
                    <form onSubmit={handlePasswordSubmit} className="mt-4">
                        <div className="space-y-2 mb-6">
                            <Label className="text-white/60">Enter Password to Confirm</Label>
                            <Input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="bg-white/5 border-white/10 text-white"
                                placeholder="Current password"
                                autoComplete="current-password"
                                autoFocus
                            />
                        </div>

                        <AlertDialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStep("confirm_text")}
                                className="border-white/10 text-white/60"
                            >
                                Back
                            </Button>
                            <Button
                                type="submit"
                                disabled={!currentPassword}
                                className="bg-red-500 hover:bg-red-600 text-white"
                            >
                                Permanently Delete
                            </Button>
                        </AlertDialogFooter>
                    </form>
                )}

                {step === "otp" && (
                    <OTPVerification
                        email={user?.email}
                        purpose="delete_account"
                        onComplete={handleOTPComplete}
                        onResend={() => sendOTPMutation.mutate()}
                        isLoading={deleteAccountMutation.isPending}
                    />
                )}

                {step === "processing" && (
                    <div className="py-8 text-center">
                        <div className="mx-auto w-12 h-12 mb-4 relative">
                            <div className="absolute inset-0 border-4 border-white/5 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-red-500 rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-white/60 text-sm">
                            Anonymizing data and deleting account...
                        </p>
                        <p className="text-white/40 text-xs mt-2">
                            Please do not close this window.
                        </p>
                    </div>
                )}

                {step === "success" && (
                    <div className="py-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Account Deleted</h3>
                        <p className="text-white/40 text-sm mb-6">
                            Your account has been successfully deleted. We're sorry to see you go.
                        </p>
                        <Button
                            onClick={handleFinalExit}
                            className="w-full bg-white/10 hover:bg-white/20 text-white"
                        >
                            Return to Home
                        </Button>
                    </div>
                )}

                {step === "failure" && (
                    <div className="py-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertOctagon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Deletion Failed</h3>
                        <p className="text-white/40 text-sm mb-2">
                            We couldn't completely delete your account.
                        </p>
                        <p className="text-red-400 text-xs px-4 py-2 bg-red-500/5 rounded border border-red-500/10 mb-6">
                            {errorMsg}
                        </p>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 border-white/10 text-white/60"
                            >
                                Close
                            </Button>
                            <Button
                                onClick={() => setStep("confirm_text")} // Retry flow
                                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                )}
            </AlertDialogContent>
        </AlertDialog>
    );
}
