import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CreditCard, ExternalLink, Globe2, ArrowRight, Loader2, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { functions } from "@/api/supabaseClient";

const COMPLIANCE_LINKS = [
    { title: "Tax Estimator Defaults", url: "TaxEstimator", desc: "Configure global baseline variables" },
    { title: "Tax Reports Dashboard", url: "TaxReports", desc: "View auto-generated local filings" },
    { title: "Tax Custom Exports", url: "TaxExport", desc: "Download unified CSV ledgers for CPAs" },
    { title: "Security Architecture", url: "Security", desc: "Review platform defensive strategies" },
    { title: "Privacy & Data Policy", url: "Privacy", desc: "Manage data residency and consent" },
];

function planLabel(plan) {
    if (plan === "pro") return "Pro";
    if (plan === "starter") return "Starter";
    return "No Plan";
}

function statusBadge(status) {
    if (status === "ACTIVE") return { label: "Active", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" };
    if (status === "PENDING") return { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-600/20" };
    if (status === "PAYMENT_FAILED") return { label: "Payment Failed", className: "bg-red-50 text-red-700 ring-red-600/20" };
    if (status === "SUSPENDED") return { label: "Suspended", className: "bg-orange-50 text-orange-700 ring-orange-600/20" };
    if (status === "CANCELLED") return { label: "Cancelled", className: "bg-gray-50 text-gray-600 ring-gray-600/20" };
    return { label: "None", className: "bg-gray-50 text-gray-500 ring-gray-400/20" };
}

export default function SettingsBilling({ user }) {
    const [subData, setSubData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        functions.invoke("getSubscriptionStatus")
            .then(setSubData)
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const sub = subData?.subscription;
    const badge = statusBadge(sub?.status);

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:shadow-md">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 ring-1 ring-purple-100">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Billing & Entitlements</h2>
                            <p className="text-sm text-gray-500">Manage your subscription tier and platform access.</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center gap-3 text-gray-400">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm">Loading subscription...</span>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/50 to-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">Active Plan</p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                                        {sub && sub.status === 'ACTIVE' ? planLabel(sub.plan) : "No Active Plan"}
                                    </h3>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${badge.className}`}>
                                        {badge.label}
                                    </span>
                                </div>
                                {subData && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Platforms: {subData.platforms_used} / {subData.entitlements?.max_platforms || 0}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link to={createPageUrl("Pricing")}>
                                    <Button variant="outline" className="w-full sm:w-auto h-10 border-gray-200 font-semibold shadow-sm hover:border-gray-300">
                                        Compare Plans
                                    </Button>
                                </Link>
                                <Link to={createPageUrl("Billing")}>
                                    <Button className="w-full sm:w-auto h-10 bg-gray-900 font-semibold text-white hover:bg-gray-800 shadow-sm">
                                        Manage Billing
                                        <ExternalLink className="ml-2 h-4 w-4 text-gray-400" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden transition-all hover:shadow-md">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-600 ring-1 ring-teal-100">
                            <Globe2 className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Compliance & Advanced Operations</h2>
                            <p className="text-sm text-gray-500">Global regulatory dashboards, automated reports, and transparency centers.</p>
                        </div>
                    </div>
                </div>

                <div className="p-2 sm:p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {COMPLIANCE_LINKS.map((link) => (
                            <Link
                                key={link.url}
                                to={createPageUrl(link.url)}
                                className="group flex items-start justify-between rounded-xl border border-transparent p-4 transition-all hover:bg-gray-50 hover:border-gray-200"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{link.title}</p>
                                    <p className="text-xs text-gray-500 mt-1">{link.desc}</p>
                                </div>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border border-gray-200 text-gray-400 opacity-0 transition-all group-hover:opacity-100 shadow-sm">
                                    <ArrowRight className="h-4 w-4 group-hover:text-indigo-600" />
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
