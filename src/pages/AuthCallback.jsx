import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/supabaseClient";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PLATFORMS } from "@/lib/platforms";

export default function AuthCallback() {
  const [status, setStatus] = useState("processing"); // processing, success, error
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      // Check for errors
      if (error) {
        setStatus("error");
        setError(errorDescription || error);
        return;
      }

      // Check if we have a code
      if (!code) {
        setStatus("error");
        setError("No authorization code received");
        return;
      }

      // 🛡️ Sentinel: Validate CSRF Token
      const storedToken = sessionStorage.getItem('oauth_state');
      let platform = state;

      // Require a stored token to ensure this browser initiated the flow
      if (!storedToken) {
        setStatus("error");
        setError("Security session expired or invalid source. Please try connecting again.");
        return;
      }

      if (state && state.includes(':')) {
        const [platformId, token] = state.split(':');
        if (token !== storedToken) {
          setStatus("error");
          setError("Security validation failed (CSRF mismatch).");
          sessionStorage.removeItem('oauth_state');
          return;
        }
        platform = platformId;
      } else {
        // If state doesn't have the token but we expect one, fail secure.
        setStatus("error");
        setError("Security error: Invalid state format.");
        sessionStorage.removeItem('oauth_state');
        return;
      }

      sessionStorage.removeItem('oauth_state'); // Consume token

      try {
        // Exchange code for tokens
        const response = await base44.functions.invoke("exchangeOAuthTokens", {
          code,
          platform: platform || "youtube"
        });

        if (response.success) {
          setStatus("success");

          // Invalidate platform queries so ConnectedPlatforms shows the new connection
          queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });

          // Resolve platform display name
          const platformName = PLATFORMS.find(p => p.id === platform)?.name || platform;

          // Redirect after a brief delay
          setTimeout(() => {
            toast.success(`${platformName} connected successfully!`);
            navigate(createPageUrl("ConnectedPlatforms"));
          }, 1500);
        } else {
          throw new Error(response.error || "Failed to connect");
        }
      } catch (err) {
        setStatus("error");
        setError(err.response?.data?.error || err.message || "Failed to connect platform");
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {status === "processing" && (
          <div className="card-modern rounded-2xl p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-zteal-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connecting Platform</h2>
            <p className="text-white/40 text-sm">Please wait while we securely connect your account...</p>
          </div>
        )}

        {status === "success" && (
          <div className="card-modern rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Successfully Connected!</h2>
            <p className="text-white/40 text-sm">Redirecting you back...</p>
          </div>
        )}

        {status === "error" && (
          <div className="card-modern rounded-2xl p-8">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 text-center">Connection Failed</h2>
            <p className="text-white/60 text-sm text-center mb-6">{error}</p>
            <Button
              onClick={() => navigate(createPageUrl("ConnectedPlatforms"))}
              className="w-full rounded-xl bg-zteal-400 text-white"
            >
              Back to Connected Platforms
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}