import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44, supabase } from "@/api/supabaseClient";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "../utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PLATFORMS } from "@/lib/platforms";

/**
 * Ensure we have a valid (non-expired) Supabase session before calling edge functions.
 * After an OAuth redirect, the cached session may be expired or not yet restored.
 * This function:
 *   1. Waits for session restoration if needed (up to timeoutMs)
 *   2. Refreshes the session if the access token is expired
 *   3. Throws if no valid session can be obtained
 */
async function ensureValidSession(timeoutMs = 5000) {
  // Step 1: Get or wait for the session to be available
  let { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Session not yet restored — wait for INITIAL_SESSION event
    session = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error('Session restoration timed out. Please log in and try again.'));
      }, timeoutMs);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
        if (s?.access_token) {
          clearTimeout(timer);
          subscription.unsubscribe();
          resolve(s);
        }
      });
    });
  }

  // Step 2: Always force-refresh after an OAuth redirect.
  // The cached access_token from localStorage may be expired or have an invalid
  // signature (e.g. rotated JWT secret). refreshSession() uses the refresh_token
  // to mint a brand-new, guaranteed-valid access_token.
  const { data: refreshed, error } = await supabase.auth.refreshSession();
  if (refreshed?.session) {
    return refreshed.session;
  }

  // Refresh failed — if we still have the original session, try it as a last resort
  console.error('[AuthCallback] Token refresh failed:', error?.message);
  if (session?.access_token) {
    return session;
  }

  throw new Error('Your session has expired. Please log in and try again.');
}

export default function AuthCallback() {
  const [status, setStatus] = useState("processing");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const processedCodeRef = React.useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      if (processedCodeRef.current) return;
      processedCodeRef.current = true;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      const state = urlParams.get("state");
      const error = urlParams.get("error");
      const errorDescription = urlParams.get("error_description");

      if (error) { setStatus("error"); setError(errorDescription || error); return; }
      if (!code) { setStatus("error"); setError("No authorization code received"); return; }

      const storedToken = localStorage.getItem('oauth_state');
      let platform = state;
      let shop = null;

      if (!storedToken) { setStatus("error"); setError("Security session expired or invalid source. Please try connecting again."); return; }

      if (state && state.includes(':')) {
        const parts = state.split(':');
        if (parts[0] === 'shopify' && parts.length === 3) {
          const [platformId, shopName, token] = parts;
          if (token !== storedToken) { setStatus("error"); setError("Security validation failed (CSRF mismatch)."); localStorage.removeItem('oauth_state'); localStorage.removeItem('shopify_shop_name'); return; }
          platform = platformId; shop = shopName || localStorage.getItem('shopify_shop_name');
        } else if (parts.length === 2) {
          const [platformId, token] = parts;
          if (token !== storedToken) { setStatus("error"); setError("Security validation failed (CSRF mismatch)."); localStorage.removeItem('oauth_state'); return; }
          platform = platformId;
        } else { setStatus("error"); setError("Security error: Invalid state format."); localStorage.removeItem('oauth_state'); return; }
      } else { setStatus("error"); setError("Security error: Invalid state format."); localStorage.removeItem('oauth_state'); return; }

      localStorage.removeItem('oauth_state');
      localStorage.removeItem('shopify_shop_name');

      try {
        // Ensure we have a valid, non-expired session before calling the edge function.
        // After an OAuth redirect, the cached session may be stale or not yet restored.
        await ensureValidSession();

        const platformDef = PLATFORMS.find(p => p.id === (platform || "youtube"));
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseOrigin = isLocal ? window.location.origin : 'https://zerithum.com';
        const redirectUri = baseOrigin + "/authcallback";
        const invokePayload = { code, platform: platform || "youtube", redirect_uri: redirectUri };
        if (platformDef?.clientId) invokePayload.client_id = platformDef.clientId;
        if (platformDef?.clientKey) invokePayload.client_key = platformDef.clientKey;
        if (shop) invokePayload.shop = shop;
        const response = await base44.functions.invoke("exchangeOAuthTokens", invokePayload);
        if (response.success) {
          setStatus("success");
          queryClient.invalidateQueries({ queryKey: ["connectedPlatforms"] });
          const platformName = platformDef?.name || platform;
          setTimeout(() => { toast.success(`${platformName} connected successfully!`); navigate(createPageUrl("ConnectedPlatforms")); }, 1500);
        } else throw new Error(response.error || "Failed to connect");
      } catch (err) { setStatus("error"); setError(err.response?.data?.error || err.message || "Failed to connect platform"); }
    };
    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="max-w-md w-full">
        {status === "processing" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Loader2 className="w-12 h-12 animate-spin text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connecting Platform</h2>
            <p className="text-gray-400 text-sm">Please wait while we securely connect your account...</p>
          </div>
        )}
        {status === "success" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4"><CheckCircle className="w-8 h-8 text-emerald-500" /></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Successfully Connected!</h2>
            <p className="text-gray-400 text-sm">Redirecting you back...</p>
          </div>
        )}
        {status === "error" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-8 h-8 text-red-500" /></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2 text-center">Connection Failed</h2>
            <p className="text-gray-500 text-sm text-center mb-6">{error}</p>
            <Button onClick={() => navigate(createPageUrl("ConnectedPlatforms"))} className="w-full bg-indigo-600 text-white hover:bg-indigo-700">Back to Connected Platforms</Button>
          </div>
        )}
      </div>
    </div>
  );
}