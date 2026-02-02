import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OTPVerification({
    email,
    purpose,
    onComplete,
    onResend,
    isLoading
}) {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const [resendCooldown, setResendCooldown] = useState(0);
    const inputRefs = useRef([]);

    useEffect(() => {
        // Focus first input on mount
        inputRefs.current[0]?.focus();
    }, []);

    useEffect(() => {
        // Resend cooldown timer
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    const handleChange = (index, value) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when complete
        if (value && index === 5) {
            const fullCode = newCode.join("");
            if (fullCode.length === 6) {
                onComplete(fullCode);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text").trim();

        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split("");
            setCode(newCode);
            inputRefs.current[5]?.focus();
            onComplete(pastedData);
        }
    };

    const handleResend = () => {
        setResendCooldown(60);
        onResend();
    };

    const maskedEmail = email?.replace(/(.{2})(.*)(@.*)/, "$1***$3") || "";

    return (
        <div className="py-4">
            <div className="text-center mb-6">
                <p className="text-white/60 text-sm">
                    We sent a 6-digit code to <span className="text-white font-mono">{maskedEmail}</span>
                </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
                {code.map((digit, index) => (
                    <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={index === 0 ? handlePaste : undefined}
                        disabled={isLoading}
                        className={cn(
                            "w-12 h-14 text-center text-2xl font-mono rounded-lg",
                            "bg-white/5 border border-white/10 text-white",
                            "focus:border-orange-400/50 focus:ring-1 focus:ring-orange-400/30",
                            "disabled:opacity-50 transition-colors"
                        )}
                    />
                ))}
            </div>

            <div className="text-center">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-white/40 hover:text-white/60"
                >
                    {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {resendCooldown > 0
                        ? `Resend code in ${resendCooldown}s`
                        : "Resend code"}
                </Button>
            </div>
        </div>
    );
}
