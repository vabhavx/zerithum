import React from "react";
import { User, CalendarClock, Loader2, Save, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { STATE_OPTIONS } from "@/lib/taxConstants";

const CURRENT_TAX_YEAR = new Date().getFullYear();

const CURRENCY_OPTIONS = [
    { value: "USD", label: "USD - US Dollar" },
    { value: "EUR", label: "EUR - Euro" },
    { value: "GBP", label: "GBP - British Pound" },
    { value: "INR", label: "INR - Indian Rupee" },
    { value: "CAD", label: "CAD - Canadian Dollar" },
    { value: "AUD", label: "AUD - Australian Dollar" },
    { value: "SGD", label: "SGD - Singapore Dollar" },
];

const TIMEZONE_OPTIONS = [
    { value: "UTC", label: "UTC" },
    { value: "America/Los_Angeles", label: "Pacific Time (US)" },
    { value: "America/Denver", label: "Mountain Time (US)" },
    { value: "America/Chicago", label: "Central Time (US)" },
    { value: "America/New_York", label: "Eastern Time (US)" },
    { value: "Europe/London", label: "London" },
    { value: "Asia/Kolkata", label: "India Standard Time" },
    { value: "Asia/Singapore", label: "Singapore" },
];

const TAX_FILING_STATUS_OPTIONS = [
    { value: "single", label: "Single" },
    { value: "married_filing_jointly", label: "Married Filing Jointly" },
    { value: "married_filing_separately", label: "Married Filing Separately" },
    { value: "head_of_household", label: "Head of Household" },
];

export default function SettingsGeneral({
    user,
    profileForm,
    setProfileForm,
    taxProfile,
    taxForm,
    setTaxForm,
    isFetchingTaxProfile,
    hasProfileChanges,
    hasTaxChanges,
    saveProfileAndAccounting,
    profileMutationPending,
    saveTaxDefaults,
    taxProfileMutationPending,
}) {
    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md">
                <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                        <User className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Identity & Accounting</h2>
                        <p className="text-sm text-gray-500">Universal profile baseline used across your workspace.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-8">
                    <div className="space-y-2.5">
                        <Label htmlFor="full_name" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Display Name</Label>
                        <Input
                            id="full_name"
                            value={profileForm.full_name}
                            onChange={(event) => setProfileForm((prev) => ({ ...prev, full_name: event.target.value }))}
                            className="h-11 border-gray-200 bg-white text-gray-900 shadow-sm focus:ring-indigo-500"
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-gray-500">Primary Email</Label>
                        <div className="relative">
                            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                id="email"
                                value={user?.email || ""}
                                readOnly
                                className="h-11 border-gray-100 bg-gray-50 pl-10 text-gray-500 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Operation Timezone</Label>
                        <Select
                            value={profileForm.timezone}
                            onValueChange={(value) => setProfileForm((prev) => ({ ...prev, timezone: value }))}
                        >
                            <SelectTrigger className="h-11 border-gray-200 bg-white text-sm text-gray-900 shadow-sm">
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Base Currency</Label>
                        <Select
                            value={profileForm.currency}
                            onValueChange={(value) => setProfileForm((prev) => ({ ...prev, currency: value }))}
                        >
                            <SelectTrigger className="h-11 border-gray-200 bg-white text-sm text-gray-900 shadow-sm">
                                <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                            <SelectContent>
                                {CURRENCY_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-8 flex justify-end border-t border-gray-100 pt-5">
                    <Button
                        type="button"
                        onClick={saveProfileAndAccounting}
                        disabled={!hasProfileChanges || profileMutationPending}
                        className="h-10 bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-all"
                    >
                        {profileMutationPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Identity Settings
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md">
                <div className="mb-5 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                        <CalendarClock className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Tax Profile Defaults <span className="text-gray-400 font-normal">({CURRENT_TAX_YEAR})</span></h2>
                        <p className="text-sm text-gray-500">Baseline configuration for automated tax estimations.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-8">
                    <div className="space-y-2.5 md:col-span-2">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filing Status</Label>
                        <Select
                            value={taxForm.filing_status}
                            onValueChange={(value) => setTaxForm((prev) => ({ ...prev, filing_status: value }))}
                        >
                            <SelectTrigger className="h-11 border-gray-200 bg-white text-sm text-gray-900 shadow-sm">
                                <SelectValue placeholder="Select filing status" />
                            </SelectTrigger>
                            <SelectContent>
                                {TAX_FILING_STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Filing State</Label>
                        <Select
                            value={taxForm.state}
                            onValueChange={(value) => setTaxForm((prev) => ({ ...prev, state: value }))}
                        >
                            <SelectTrigger className="h-11 border-gray-200 bg-white text-sm text-gray-900 shadow-sm">
                                <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent>
                                {STATE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                    <p className="text-sm text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-md">
                        {isFetchingTaxProfile ? (
                            <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Syncing...</span>
                        ) : (
                            `Region: ${taxForm.country === 'US' ? 'United States' : taxForm.country}`
                        )}
                    </p>
                    <Button
                        type="button"
                        onClick={saveTaxDefaults}
                        disabled={!hasTaxChanges || taxProfileMutationPending}
                        className="h-10 bg-indigo-600 px-6 text-sm font-medium text-white hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition-all"
                    >
                        {taxProfileMutationPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Tax Profile
                    </Button>
                </div>
            </div>
        </div>
    );
}
