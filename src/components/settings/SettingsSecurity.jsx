import React from "react";
import { ShieldCheck, KeyRound, AlertTriangle, ArrowRight } from "lucide-react";

export default function SettingsSecurity({
    hasPasswordAuth,
    setPasswordOpen,
    setSignOutAllOpen,
    setDeleteAccountOpen,
}) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700 ring-1 ring-slate-200">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Security & Access</h2>
                            <p className="text-sm text-gray-500">Manage your credentials, active sessions, and account lifecycle.</p>
                        </div>
                    </div>
                </div>

                <div className="p-2 sm:p-4">
                    <div className="grid grid-cols-1 gap-3">
                        {hasPasswordAuth ? (
                            <button
                                type="button"
                                onClick={() => setPasswordOpen(true)}
                                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-transparent p-4 text-left transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-transform group-hover:scale-105">
                                        <KeyRound className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">Change Password</p>
                                        <p className="text-sm text-gray-500">Update your account credentials to maintain security</p>
                                    </div>
                                </div>
                                <div className="hidden sm:flex items-center text-sm font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100">
                                    Update <ArrowRight className="ml-1 h-4 w-4" />
                                </div>
                            </button>
                        ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-left cursor-not-allowed">
                                <div className="flex items-center gap-4 opacity-70">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400">
                                        <KeyRound className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">Password Management</p>
                                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                            Authenticated via external provider (Google)
                                        </p>
                                    </div>
                                </div>
                                <div className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200">
                                    Managed Externally
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-gray-100 mx-4" />

                        <button
                            type="button"
                            onClick={() => setSignOutAllOpen(true)}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-transparent p-4 text-left transition-all hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                        >
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm transition-transform group-hover:scale-105">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-base font-semibold text-gray-900">Sign Out All Devices</p>
                                    <p className="text-sm text-gray-500">Instantly revoke all active sessions across all devices</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center text-sm font-medium text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                                Revoke Access <ArrowRight className="ml-1 h-4 w-4" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-red-200 bg-red-50/30 p-1 ring-1 ring-red-100">
                <button
                    type="button"
                    onClick={() => setDeleteAccountOpen(true)}
                    className="group flex w-full flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg bg-white p-5 text-left transition-all hover:bg-red-50 hover:shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-600 shadow-sm transition-transform group-hover:scale-105">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-red-700">Delete Account & Data</p>
                            <p className="text-sm text-red-500/80 font-medium">Permanently erase all your data and access. This action cannot be undone.</p>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors">
                        Proceed to Deletion
                    </div>
                </button>
            </div>
        </div>
    );
}
