import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { functions } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, XCircle, ArrowLeft, RefreshCw, ExternalLink } from 'lucide-react';

const POLL_INTERVAL_MS = 3000;
const TIMEOUT_MS = 90000;

export default function BillingConfirm() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('polling'); // polling | active | timeout | error
    const [plan, setPlan] = useState(null);
    const pollRef = useRef(null);
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        const poll = async () => {
            try {
                const result = await functions.invoke('getSubscriptionStatus');
                const sub = result?.subscription;

                if (sub?.status === 'ACTIVE') {
                    setStatus('active');
                    setPlan(sub.plan);
                    clearInterval(pollRef.current);
                    // Redirect to dashboard after a brief celebration
                    setTimeout(() => navigate('/Dashboard'), 3000);
                    return;
                }

                if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
                    setStatus('timeout');
                    clearInterval(pollRef.current);
                }
            } catch (err) {
                console.error('Poll error:', err);
                if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
                    setStatus('error');
                    clearInterval(pollRef.current);
                }
            }
        };

        // Start polling
        poll();
        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);

        return () => clearInterval(pollRef.current);
    }, [navigate]);

    const handleRetry = () => {
        setStatus('polling');
        startTimeRef.current = Date.now();
        const poll = async () => {
            try {
                const result = await functions.invoke('getSubscriptionStatus');
                if (result?.subscription?.status === 'ACTIVE') {
                    setStatus('active');
                    setPlan(result.subscription.plan);
                    clearInterval(pollRef.current);
                    setTimeout(() => navigate('/Dashboard'), 3000);
                }
                if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
                    setStatus('timeout');
                    clearInterval(pollRef.current);
                }
            } catch {
                if (Date.now() - startTimeRef.current > TIMEOUT_MS) {
                    setStatus('error');
                    clearInterval(pollRef.current);
                }
            }
        };
        poll();
        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                    {/* Top gradient */}
                    <div className="h-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600" />

                    <div className="p-8 text-center">
                        {/* Polling State */}
                        {status === 'polling' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="relative mb-6">
                                    <div className="h-16 w-16 rounded-full bg-indigo-50 flex items-center justify-center">
                                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                                    </div>
                                    <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-indigo-100 animate-ping opacity-20" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Activating Your Subscription</h2>
                                <p className="text-sm text-gray-500 mb-1">We're confirming your payment with PayPal.</p>
                                <p className="text-xs text-gray-400">This usually takes a few seconds...</p>

                                <div className="mt-6 flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                                    <span className="text-xs text-gray-500 font-medium">Waiting for PayPal confirmation</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Active State */}
                        {status === 'active' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="flex flex-col items-center"
                            >
                                <div className="mb-6 h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">You're All Set!</h2>
                                <p className="text-sm text-gray-500 mb-4">
                                    Your <span className="font-semibold capitalize text-gray-700">{plan}</span> subscription is now active.
                                </p>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 border border-emerald-100">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm text-emerald-700 font-medium">Redirecting to dashboard...</span>
                                </div>
                            </motion.div>
                        )}

                        {/* Timeout / Error State */}
                        {(status === 'timeout' || status === 'error') && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center"
                            >
                                <div className="mb-6 h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
                                    <XCircle className="h-9 w-9 text-amber-500" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Taking Longer Than Expected</h2>
                                <p className="text-sm text-gray-500 mb-6">
                                    Your payment may still be processing. PayPal can sometimes take a minute to confirm.
                                </p>

                                <div className="flex flex-col gap-3 w-full">
                                    <Button onClick={handleRetry} className="w-full h-10 bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-semibold">
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Retry
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate('/Billing')}
                                        className="w-full h-10 border-gray-200 text-gray-600 text-sm font-medium"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Return to Billing
                                    </Button>
                                    <a
                                        href="mailto:support@zerithum.com"
                                        className="inline-flex items-center justify-center gap-1.5 h-10 rounded-md text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        Contact Support
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
