import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
    Check, CreditCard, Loader2, AlertTriangle, Shield, Zap,
    XCircle, HelpCircle, Crown, ArrowUpRight, ExternalLink,
} from 'lucide-react';

const PLANS = [
    {
        id: 'starter',
        name: 'Starter',
        price: 9,
        maxPlatforms: 3,
        description: 'For creators getting started',
        features: [
            'Connect up to 3 platforms',
            'Unified revenue dashboard',
            'Basic transaction tracking',
            'Manual data exports',
            'Email support',
        ],
        color: 'indigo',
        gradientFrom: 'from-indigo-500',
        gradientTo: 'to-blue-600',
        bgAccent: 'bg-indigo-50',
        textAccent: 'text-indigo-600',
        borderAccent: 'border-indigo-200',
        ringAccent: 'ring-indigo-600',
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 15,
        maxPlatforms: 5,
        description: 'For serious creators scaling up',
        popular: true,
        features: [
            'Connect up to 5 platforms',
            'Advanced analytics & insights',
            'Tax estimator & exports',
            'Bank reconciliation',
            'Priority support',
            'AI-powered insights',
        ],
        color: 'violet',
        gradientFrom: 'from-violet-500',
        gradientTo: 'to-purple-600',
        bgAccent: 'bg-violet-50',
        textAccent: 'text-violet-600',
        borderAccent: 'border-violet-200',
        ringAccent: 'ring-violet-600',
    },
];

function statusConfig(status) {
    switch (status) {
        case 'ACTIVE':
            return { color: 'emerald', label: 'Active', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', Icon: Check };
        case 'PENDING':
            return { color: 'amber', label: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500 animate-pulse', Icon: Loader2 };
        case 'SUSPENDED':
            return { color: 'orange', label: 'Suspended', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', dot: 'bg-orange-500', Icon: AlertTriangle };
        case 'CANCELLED':
            return { color: 'gray', label: 'Cancelled', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', Icon: XCircle };
        case 'PAYMENT_FAILED':
            return { color: 'red', label: 'Payment Failed', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500', Icon: AlertTriangle };
        case 'EXPIRED':
            return { color: 'gray', label: 'Expired', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400', Icon: XCircle };
        default:
            return { color: 'gray', label: 'No Subscription', bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-200', dot: 'bg-gray-300', Icon: HelpCircle };
    }
}

function SkeletonCard() {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-6 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-4" />
            <div className="h-8 w-24 bg-gray-200 rounded mb-6" />
            <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-3 bg-gray-100 rounded w-full" />)}
            </div>
            <div className="h-10 bg-gray-200 rounded mt-6" />
        </div>
    );
}

export default function Billing() {
    const [loading, setLoading] = useState(true);
    const [subscribing, setSubscribing] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [data, setData] = useState(null);

    const fetchStatus = useCallback(async () => {
        try {
            const result = await base44.functions.invoke('getSubscriptionStatus');
            setData(result);
        } catch (err) {
            console.error('Failed to load subscription status:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const handleSubscribe = async (planId) => {
        setSubscribing(planId);
        try {
            const result = await base44.functions.invoke('createPaypalSubscription', { plan: planId });
            if (result.approvalUrl) {
                window.location.href = result.approvalUrl;
            } else {
                toast.error('Could not start subscription flow');
            }
        } catch (err) {
            toast.error(err.message || 'Subscription failed');
        } finally {
            setSubscribing(null);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await base44.functions.invoke('cancelPaypalSubscription');
            toast.success('Subscription cancelled successfully');
            setCancelModalOpen(false);
            fetchStatus();
        } catch (err) {
            toast.error(err.message || 'Cancellation failed');
        } finally {
            setCancelling(false);
        }
    };

    const sub = data?.subscription;
    const maxPlatforms = data?.entitlements?.max_platforms ?? 0;
    const platformsUsed = data?.platforms_used ?? 0;
    const usagePercent = maxPlatforms > 0 ? Math.min(100, (platformsUsed / maxPlatforms) * 100) : 0;
    const status = sub ? statusConfig(sub.status) : statusConfig(null);
    const isActive = sub?.status === 'ACTIVE';

    const ctaLabel = (plan) => {
        if (!sub || !isActive) return 'Subscribe';
        if (sub.plan === plan.id) return 'Current Plan';
        if (plan.id === 'pro' && sub.plan === 'starter') return 'Upgrade';
        if (plan.id === 'starter' && sub.plan === 'pro') return 'Downgrade';
        return 'Switch';
    };

    return (
        <div className="max-w-[1100px] mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md">
                        <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Billing & Subscription</h1>
                </div>
                <p className="text-sm text-gray-500 ml-[52px]">Manage your plan, view usage, and control your subscription.</p>
            </motion.div>

            {/* Plan Cards */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
            >
                {loading ? (
                    <>
                        <SkeletonCard />
                        <SkeletonCard />
                    </>
                ) : (
                    PLANS.map((plan, i) => {
                        const isCurrent = isActive && sub?.plan === plan.id;
                        const label = ctaLabel(plan);
                        const isSubscribing = subscribing === plan.id;

                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
                                className={`relative rounded-xl border bg-white overflow-hidden transition-all duration-300 hover:shadow-lg ${isCurrent
                                        ? `${plan.borderAccent} ring-2 ${plan.ringAccent} shadow-md`
                                        : plan.popular
                                            ? 'border-gray-200 shadow-sm'
                                            : 'border-gray-200'
                                    }`}
                            >
                                {/* Gradient accent bar */}
                                <div className={`h-1.5 bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo}`} />

                                {plan.popular && !isCurrent && (
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                                            <Zap className="h-3 w-3" /> Popular
                                        </span>
                                    </div>
                                )}

                                {isCurrent && (
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                            <Crown className="h-3 w-3" /> Current
                                        </span>
                                    </div>
                                )}

                                <div className="p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.name}</h3>
                                    <p className="text-xs text-gray-500 mb-5">{plan.description}</p>

                                    <div className="flex items-end gap-1 mb-1">
                                        <span className="text-4xl font-black tracking-tight text-gray-900">${plan.price}</span>
                                        <span className="text-sm text-gray-400 pb-1 font-medium">/month</span>
                                    </div>

                                    <div className={`mt-1 mb-6 inline-flex items-center gap-1.5 rounded-md ${plan.bgAccent} px-2.5 py-1`}>
                                        <Shield className={`h-3.5 w-3.5 ${plan.textAccent}`} />
                                        <span className={`text-xs font-semibold ${plan.textAccent}`}>
                                            Up to {plan.maxPlatforms} platforms
                                        </span>
                                    </div>

                                    <ul className="space-y-2.5 mb-6">
                                        {plan.features.map((f) => (
                                            <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                                                <div className="mt-0.5 rounded-full bg-emerald-50 p-0.5 flex-shrink-0">
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                                </div>
                                                <span className="leading-tight">{f}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        onClick={() => handleSubscribe(plan.id)}
                                        disabled={isCurrent || isSubscribing}
                                        className={`w-full h-11 text-sm font-semibold transition-all duration-200 ${isCurrent
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : `bg-gradient-to-r ${plan.gradientFrom} ${plan.gradientTo} text-white hover:opacity-90 shadow-sm`
                                            }`}
                                    >
                                        {isSubscribing ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                                        ) : (
                                            <>{label}{!isCurrent && <ArrowUpRight className="ml-1.5 h-4 w-4" />}</>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </motion.section>

            {/* Active Subscription Panel */}
            {!loading && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mb-8"
                >
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                            <h2 className="text-sm font-semibold text-gray-900">Subscription Status</h2>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Status */}
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Status</p>
                                    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${status.bg} ${status.border}`}>
                                        <span className={`h-2 w-2 rounded-full ${status.dot}`} />
                                        <span className={`text-sm font-semibold ${status.text}`}>{status.label}</span>
                                    </div>
                                </div>

                                {/* Platforms Used */}
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Platform Usage</p>
                                    <div className="flex items-end gap-1.5 mb-2">
                                        <span className="text-2xl font-bold text-gray-900">{platformsUsed}</span>
                                        <span className="text-sm text-gray-400 pb-0.5">/ {maxPlatforms || '—'}</span>
                                    </div>
                                    {maxPlatforms > 0 && (
                                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${usagePercent}%` }}
                                                transition={{ duration: 0.8, delay: 0.5 }}
                                                className={`h-full rounded-full transition-colors ${usagePercent >= 100
                                                        ? 'bg-red-500'
                                                        : usagePercent >= 80
                                                            ? 'bg-amber-500'
                                                            : 'bg-indigo-500'
                                                    }`}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* Next Billing */}
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-2">Next Billing</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {sub?.current_period_end
                                            ? new Date(sub.current_period_end).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-100">
                                {isActive && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setCancelModalOpen(true)}
                                        className="h-9 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-sm font-medium"
                                    >
                                        Cancel Subscription
                                    </Button>
                                )}
                                <a
                                    href="mailto:support@zerithum.com"
                                    className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    Contact Support
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* Re-subscribe prompt for cancelled/failed */}
            {!loading && sub && ['CANCELLED', 'PAYMENT_FAILED', 'SUSPENDED', 'EXPIRED'].includes(sub.status) && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-8"
                >
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-amber-900 mb-1">
                                Your subscription is {sub.status.toLowerCase().replace('_', ' ')}
                            </p>
                            <p className="text-sm text-amber-700">
                                Platform connections are disabled. Subscribe to a plan above to restore access.
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Cancel Confirmation Modal */}
            <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                <DialogContent className="max-w-md rounded-xl border border-gray-200 bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-gray-900">Cancel Subscription?</DialogTitle>
                        <DialogDescription className="text-gray-500">
                            Your platform connections will be disabled immediately. You can re-subscribe at any time.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={() => setCancelModalOpen(false)}
                            className="h-9 border-gray-200 text-gray-600"
                        >
                            Keep Subscription
                        </Button>
                        <Button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="h-9 bg-red-600 text-white hover:bg-red-700"
                        >
                            {cancelling ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Cancelling...</>
                            ) : (
                                'Yes, Cancel'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
