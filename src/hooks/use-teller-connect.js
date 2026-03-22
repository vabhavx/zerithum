import { useState, useCallback, useEffect, useRef } from "react";
import { functions } from "@/api/supabaseClient";

const TELLER_CONNECT_URL = "https://cdn.teller.io/connect/connect.js";
const LOADING_TIMEOUT_MS = 30_000; // 30s safety timeout

/**
 * Hook for Teller Connect enrollment flow.
 *
 * Handles: script loading, nonce generation, widget open,
 * enrollment submission, and initial sync trigger.
 */
export function useTellerConnect({ onSuccess, onError, enrollmentId } = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [scriptReady, setScriptReady] = useState(false);
    const [scriptError, setScriptError] = useState(false);
    const tellerRef = useRef(null);
    const timeoutRef = useRef(null);

    // Use refs for callbacks to avoid stale closures and unnecessary
    // re-creations of the `open` function on every render.
    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    // Clear safety timeout helper
    const clearSafetyTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    // Reset loading state (used by callbacks and timeout)
    const resetLoading = useCallback(() => {
        setIsLoading(false);
        clearSafetyTimeout();
    }, [clearSafetyTimeout]);

    // Load Teller Connect script once
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Already available
        if (window.TellerConnect) {
            setScriptReady(true);
            return;
        }

        // Script tag already in DOM — may already be loaded (race condition fix)
        const existing = document.querySelector(`script[src="${TELLER_CONNECT_URL}"]`);
        if (existing) {
            const check = () => {
                if (window.TellerConnect) setScriptReady(true);
            };
            existing.addEventListener("load", check);
            check();
            return () => existing.removeEventListener("load", check);
        }

        const script = document.createElement("script");
        script.src = TELLER_CONNECT_URL;
        script.async = true;
        script.onload = () => {
            if (window.TellerConnect) {
                setScriptReady(true);
            } else {
                console.error("[TellerConnect] Script loaded but TellerConnect not found on window");
                setScriptError(true);
            }
        };
        script.onerror = () => {
            console.error("[TellerConnect] Failed to load script from CDN");
            setScriptError(true);
        };
        document.head.appendChild(script);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => clearSafetyTimeout, [clearSafetyTimeout]);

    const open = useCallback(async () => {
        if (isLoading) return;

        // Pre-flight: check script availability before doing anything async
        if (!window.TellerConnect) {
            const msg = scriptError
                ? "Teller Connect could not be loaded. Please disable ad-blockers or try a different browser."
                : "Teller Connect is still loading. Please try again in a moment.";
            onErrorRef.current?.(new Error(msg));
            return;
        }

        setIsLoading(true);

        // Safety timeout: if the Teller widget never calls back, reset loading state
        clearSafetyTimeout();
        timeoutRef.current = setTimeout(() => {
            console.error("[TellerConnect] Safety timeout — widget never responded");
            setIsLoading(false);
            onErrorRef.current?.(new Error("Bank connection timed out. Please try again."));
        }, LOADING_TIMEOUT_MS);

        try {
            // 1. Get nonce and app config from backend
            const config = await functions.invoke("tellerGenerateNonce");

            if (!config?.nonce || !config?.applicationId) {
                throw new Error("Failed to get Teller configuration. Please contact support.");
            }

            // 2. Verify TellerConnect is still available (could have been garbage collected)
            if (!window.TellerConnect) {
                throw new Error("Teller Connect became unavailable. Please refresh and try again.");
            }

            // 3. Setup Teller Connect
            const setupOptions = {
                applicationId: config.applicationId,
                nonce: config.nonce,
                environment: config.environment || "development",
                products: ["transactions"],
                onSuccess: async (enrollment) => {
                    try {
                        // Send enrollment to backend for verification
                        const result = await functions.invoke("tellerEnrollment", {
                            accessToken: enrollment.accessToken,
                            enrollment: enrollment.enrollment,
                            user: enrollment.user,
                            signatures: enrollment.signatures,
                            nonce: config.nonce,
                        });

                        // Trigger initial sync
                        if (result?.connectionId) {
                            try {
                                await functions.invoke("tellerSync", {
                                    connectionId: result.connectionId,
                                });
                            } catch (syncErr) {
                                console.error("[TellerConnect] Initial sync error:", syncErr);
                            }
                        }

                        resetLoading();
                        onSuccessRef.current?.(result);
                    } catch (err) {
                        resetLoading();
                        onErrorRef.current?.(err);
                    }
                },
                onExit: () => {
                    resetLoading();
                },
                onFailure: (error) => {
                    resetLoading();
                    onErrorRef.current?.(error);
                },
            };

            // For reauth, pass the existing enrollmentId
            if (enrollmentId) {
                setupOptions.enrollmentId = enrollmentId;
            }

            tellerRef.current = window.TellerConnect.setup(setupOptions);
            tellerRef.current.open();
        } catch (err) {
            resetLoading();
            onErrorRef.current?.(err);
        }
    }, [isLoading, enrollmentId, resetLoading, clearSafetyTimeout, scriptError]);

    return {
        open,
        isLoading,
        ready: scriptReady,
        scriptError,
    };
}
