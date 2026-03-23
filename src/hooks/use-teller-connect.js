import { useState, useCallback, useEffect, useRef } from "react";
import { functions } from "@/api/supabaseClient";

const TELLER_CONNECT_URL = "https://cdn.teller.io/connect/connect.js";
const LOADING_TIMEOUT_MS = 180_000; // 3 minutes — sandbox flow needs manual input

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

    const onSuccessRef = useRef(onSuccess);
    const onErrorRef = useRef(onError);
    useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
    useEffect(() => { onErrorRef.current = onError; }, [onError]);

    const clearSafetyTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const resetLoading = useCallback(() => {
        setIsLoading(false);
        clearSafetyTimeout();
    }, [clearSafetyTimeout]);

    // Load Teller Connect script once
    useEffect(() => {
        if (typeof window === "undefined") return;

        if (window.TellerConnect) {
            console.log("[TellerConnect] SDK already available on window");
            setScriptReady(true);
            return;
        }

        const existing = document.querySelector(`script[src="${TELLER_CONNECT_URL}"]`);
        if (existing) {
            const check = () => {
                if (window.TellerConnect) {
                    console.log("[TellerConnect] SDK loaded (existing script tag)");
                    setScriptReady(true);
                }
            };
            existing.addEventListener("load", check);
            check();
            return () => existing.removeEventListener("load", check);
        }

        console.log("[TellerConnect] Loading SDK from CDN...");
        const script = document.createElement("script");
        script.src = TELLER_CONNECT_URL;
        script.async = true;
        script.onload = () => {
            if (window.TellerConnect) {
                console.log("[TellerConnect] SDK loaded successfully");
                setScriptReady(true);
            } else {
                console.error("[TellerConnect] Script loaded but TellerConnect not found on window");
                setScriptError(true);
            }
        };
        script.onerror = (e) => {
            console.error("[TellerConnect] Failed to load script from CDN:", e);
            setScriptError(true);
        };
        document.head.appendChild(script);
    }, []);

    useEffect(() => clearSafetyTimeout, [clearSafetyTimeout]);

    const open = useCallback(async () => {
        console.log("[TellerConnect] open() called — isLoading:", isLoading, "scriptReady:", scriptReady, "TellerConnect:", !!window.TellerConnect);

        if (isLoading) {
            console.warn("[TellerConnect] Already loading, ignoring click");
            return;
        }

        if (!window.TellerConnect) {
            const msg = scriptError
                ? "Teller Connect could not be loaded. Please disable ad-blockers or try a different browser."
                : "Teller Connect is still loading. Please try again in a moment.";
            console.error("[TellerConnect] SDK not available:", msg);
            onErrorRef.current?.(new Error(msg));
            return;
        }

        setIsLoading(true);

        clearSafetyTimeout();
        timeoutRef.current = setTimeout(() => {
            console.error("[TellerConnect] Safety timeout — widget never responded after 30s");
            setIsLoading(false);
            onErrorRef.current?.(new Error("Bank connection timed out. Please try again."));
        }, LOADING_TIMEOUT_MS);

        try {
            // 1. Get nonce and app config from backend
            console.log("[TellerConnect] Fetching nonce from tellerGenerateNonce...");
            const config = await functions.invoke("tellerGenerateNonce");
            console.log("[TellerConnect] Nonce response:", {
                hasNonce: !!config?.nonce,
                applicationId: config?.applicationId,
                environment: config?.environment,
            });

            if (!config?.nonce || !config?.applicationId) {
                throw new Error(
                    config?.error
                        ? `Teller configuration error: ${config.error}`
                        : "Failed to get Teller configuration. Please contact support."
                );
            }

            if (!window.TellerConnect) {
                throw new Error("Teller Connect became unavailable. Please refresh and try again.");
            }

            // 2. Setup Teller Connect
            const setupOptions = {
                applicationId: config.applicationId,
                nonce: config.nonce,
                environment: config.environment || "sandbox",
                products: ["transactions"],
                onSuccess: async (enrollment) => {
                    console.log("[TellerConnect] Enrollment success — raw payload:", JSON.stringify(enrollment, null, 2));
                    console.log("[TellerConnect] Keys:", Object.keys(enrollment));
                    try {
                        const result = await functions.invoke("tellerEnrollment", {
                            accessToken: enrollment.accessToken,
                            enrollment: enrollment.enrollment,
                            user: enrollment.user,
                            signatures: enrollment.signatures,
                            nonce: config.nonce,
                        });
                        console.log("[TellerConnect] Enrollment stored, connectionId:", result?.connectionId);

                        if (result?.connectionId) {
                            try {
                                await functions.invoke("tellerSync", {
                                    connectionId: result.connectionId,
                                });
                                console.log("[TellerConnect] Initial sync completed");
                            } catch (syncErr) {
                                console.error("[TellerConnect] Initial sync error:", syncErr);
                            }
                        }

                        resetLoading();
                        onSuccessRef.current?.(result);
                    } catch (err) {
                        console.error("[TellerConnect] Enrollment submission failed:", err);
                        resetLoading();
                        onErrorRef.current?.(err);
                    }
                },
                onExit: () => {
                    console.log("[TellerConnect] Widget closed by user (onExit)");
                    resetLoading();
                },
                onFailure: (error) => {
                    console.error("[TellerConnect] Widget failure (onFailure):", error);
                    resetLoading();
                    onErrorRef.current?.(error);
                },
                onEvent: (name, data) => {
                    console.log("[TellerConnect] Event:", name, data);
                },
            };

            if (enrollmentId) {
                setupOptions.enrollmentId = enrollmentId;
            }

            console.log("[TellerConnect] Calling TellerConnect.setup() with appId:", config.applicationId, "env:", setupOptions.environment);
            tellerRef.current = window.TellerConnect.setup(setupOptions);
            console.log("[TellerConnect] Calling tellerConnect.open()...");
            tellerRef.current.open();
            console.log("[TellerConnect] Widget open() called — widget should be visible now");
        } catch (err) {
            console.error("[TellerConnect] Error in open flow:", err);
            resetLoading();
            onErrorRef.current?.(err);
        }
    }, [isLoading, enrollmentId, resetLoading, clearSafetyTimeout, scriptError, scriptReady]);

    return {
        open,
        isLoading,
        ready: scriptReady,
        scriptError,
    };
}
