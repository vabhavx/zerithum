import { useState, useCallback, useEffect, useRef } from "react";
import { functions } from "@/api/supabaseClient";

const TELLER_CONNECT_URL = "https://cdn.teller.io/connect/connect.js";

/**
 * Hook for Teller Connect enrollment flow.
 *
 * Handles: script loading, nonce generation, widget open,
 * enrollment submission, and initial sync trigger.
 */
export function useTellerConnect({ onSuccess, onError, enrollmentId } = {}) {
    const [isLoading, setIsLoading] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const tellerRef = useRef(null);

    // Load Teller Connect script once
    useEffect(() => {
        if (typeof window === "undefined") return;

        // Already available
        if (window.TellerConnect) {
            setScriptLoaded(true);
            return;
        }

        // Script tag already in DOM — may already be loaded (race condition fix)
        const existing = document.querySelector(`script[src="${TELLER_CONNECT_URL}"]`);
        if (existing) {
            // Re-check after a tick in case onload already fired
            const check = () => {
                if (window.TellerConnect) setScriptLoaded(true);
            };
            existing.addEventListener("load", check);
            // Immediate check in case it already loaded before this listener attached
            check();
            return () => existing.removeEventListener("load", check);
        }

        const script = document.createElement("script");
        script.src = TELLER_CONNECT_URL;
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        script.onerror = () => {
            console.error("[TellerConnect] Failed to load script");
            // Allow button to be clickable even if CDN fails — open() will throw a clear error
            setScriptLoaded(true);
        };
        document.head.appendChild(script);
    }, []);

    const open = useCallback(async () => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            // 1. Get nonce and app config from backend
            const config = await functions.invoke("tellerGenerateNonce");

            if (!config?.nonce || !config?.applicationId) {
                throw new Error("Failed to get Teller configuration");
            }

            // 2. Setup Teller Connect
            const setupOptions = {
                applicationId: config.applicationId,
                nonce: config.nonce,
                environment: config.environment || "development",
                products: ["transactions"],
                onSuccess: async (enrollment) => {
                    try {
                        // 3. Send enrollment to backend for verification
                        const result = await functions.invoke("tellerEnrollment", {
                            accessToken: enrollment.accessToken,
                            enrollment: enrollment.enrollment,
                            user: enrollment.user,
                            signatures: enrollment.signatures,
                            nonce: config.nonce,
                        });

                        // 4. Trigger initial sync
                        if (result?.connectionId) {
                            try {
                                await functions.invoke("tellerSync", {
                                    connectionId: result.connectionId,
                                });
                            } catch (syncErr) {
                                console.error("[TellerConnect] Initial sync error:", syncErr);
                            }
                        }

                        setIsLoading(false);
                        onSuccess?.(result);
                    } catch (err) {
                        setIsLoading(false);
                        onError?.(err);
                    }
                },
                onExit: () => {
                    setIsLoading(false);
                },
                onFailure: (error) => {
                    setIsLoading(false);
                    onError?.(error);
                },
            };

            // For reauth, pass the existing enrollmentId
            if (enrollmentId) {
                setupOptions.enrollmentId = enrollmentId;
            }

            if (!window.TellerConnect) {
                throw new Error("Teller Connect script not loaded");
            }

            tellerRef.current = window.TellerConnect.setup(setupOptions);
            tellerRef.current.open();
        } catch (err) {
            setIsLoading(false);
            onError?.(err);
        }
    }, [isLoading, enrollmentId, onSuccess, onError]);

    return {
        open,
        isLoading,
        ready: scriptLoaded,
    };
}
