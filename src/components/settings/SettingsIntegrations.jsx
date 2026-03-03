import React from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Search, Loader2, Link2, ExternalLink, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createPageUrl } from "@/utils";

const PLATFORM_NAMES = {
    youtube: "YouTube",
    patreon: "Patreon",
    stripe: "Stripe",
    gumroad: "Gumroad",
    tiktok: "TikTok",
    shopify: "Shopify",
    substack: "Substack",
    twitch: "Twitch",
    paypal: "PayPal",
    paddle: "Paddle",
    lemonsqueezy: "Lemon Squeezy",
    razorpay: "Razorpay",
};

function statusLabel(status) {
    if (status === "active" || status === "synced") return "Healthy Connection";
    if (status === "syncing") return "Syncing Data...";
    if (status === "error") return "Needs Attention";
    if (status === "pending") return "Pending Authentication";
    return status || "Unknown Status";
}

function statusTone(status) {
    if (status === "active" || status === "synced") return { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500 ring-emerald-200", border: 'border-emerald-200' };
    if (status === "syncing") return { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500 ring-blue-200", border: 'border-blue-200' };
    if (status === "error") return { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500 ring-red-200", border: 'border-red-200' };
    return { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500 ring-amber-200", border: 'border-amber-200' };
}

export default function SettingsIntegrations({
    platformSearch,
    setPlatformSearch,
    filteredPlatforms,
    isFetchingPlatforms,
    setDisconnectPlatform,
}) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
                            <Database className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Data Sources & Integrations</h2>
                            <p className="text-sm text-gray-500">Monitor sync health and manage connected financial accounts.</p>
                        </div>
                    </div>
                    <Link
                        to={createPageUrl("ConnectedPlatforms")}
                        className="inline-flex items-center justify-center rounded-lg bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-sm ring-1 ring-inset ring-indigo-200/50"
                    >
                        Manage Library
                        <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                </div>

                <div className="p-6">
                    <div className="relative mb-6">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                            value={platformSearch}
                            onChange={(event) => setPlatformSearch(event.target.value)}
                            placeholder="Search connected platforms (e.g., Stripe, Shopify)..."
                            className="h-11 border-gray-200 bg-gray-50/50 pl-10 text-sm shadow-inner transition-colors focus:bg-white"
                        />
                    </div>

                    {isFetchingPlatforms ? (
                        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
                            <p className="mt-3 text-sm font-medium text-gray-500">Syncing platform telemetry...</p>
                        </div>
                    ) : filteredPlatforms.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-12 text-center">
                            <Database className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                            <h3 className="text-sm font-semibold text-gray-900">No active integrations</h3>
                            <p className="mt-1 text-sm text-gray-500">Connect a revenue source to start analyzing your data.</p>
                            <div className="mt-6">
                                <Link to={createPageUrl("ConnectedPlatforms")}>
                                    <Button type="button" variant="outline" className="h-9 font-medium shadow-sm">
                                        Browse Platform Library
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {filteredPlatforms.map((platform) => {
                                const tone = statusTone(platform.sync_status);
                                const isHealthy = platform.sync_status === 'active' || platform.sync_status === 'synced';

                                return (
                                    <div
                                        key={platform.id}
                                        className={cn(
                                            "group relative flex flex-col justify-between overflow-hidden rounded-xl border p-5 transition-all hover:shadow-md",
                                            isHealthy ? "border-gray-200 bg-white hover:border-gray-300" : `border-transparent ${tone.bg} ring-1 ring-inset ${tone.border}`
                                        )}
                                    >
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn("relative flex h-3 w-3 items-center justify-center")}>
                                                    <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 hidden", isHealthy && 'block', tone.dot)}></span>
                                                    <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full ring-2", tone.dot)}></span>
                                                </div>
                                                <h3 className="text-base font-bold text-gray-900 tracking-tight">
                                                    {PLATFORM_NAMES[platform.platform] || platform.platform}
                                                </h3>
                                            </div>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => setDisconnectPlatform(platform)}
                                                className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors tooltip"
                                                title="Disconnect Platform"
                                            >
                                                <Link2 className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        <div>
                                            <p className={cn("inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-inset", tone.bg, tone.text, tone.border)}>
                                                {statusLabel(platform.sync_status)}
                                            </p>
                                            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                                                <span className="text-xs font-medium text-gray-500">Last Synced</span>
                                                <span className="text-xs text-gray-900 font-medium">
                                                    {platform.last_synced_at
                                                        ? format(new Date(platform.last_synced_at), "MMM d, h:mm a")
                                                        : "Pending initialization"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
