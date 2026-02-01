import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Check, X, Crown, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PLANS = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for getting started',
    features: [
      { text: '2 platform connections', included: true },
      { text: '30-day history', included: true },
      { text: 'Basic dashboard', included: true },
      { text: 'Bank reconciliation', included: false },
      { text: 'Tax export', included: false },
      { text: 'AI insights', included: false },
      { text: 'White-label', included: false }
    ]
  },
  {
    tier: 'pro',
    name: 'Creator Pro',
    price: 49,
    description: 'Best for full-time creators',
    badge: 'POPULAR',
    features: [
      { text: '5 platform connections', included: true },
      { text: 'Unlimited history', included: true },
      { text: 'Advanced dashboard', included: true },
      { text: 'Bank reconciliation', included: true },
      { text: 'Tax export (CSV, PDF)', included: true },
      { text: 'AI insights', included: true },
      { text: 'White-label', included: false }
    ],
    annualPrice: 490,
    annualSavings: 98
  },
  {
    tier: 'max',
    name: 'Creator Max',
    price: 199,
    description: 'For agencies & power users',
    badge: 'BEST VALUE',
    features: [
      { text: 'Unlimited platforms', included: true },
      { text: 'Unlimited history', included: true },
      { text: 'Advanced dashboard', included: true },
      { text: 'Bank reconciliation', included: true },
      { text: 'Tax export (all formats)', included: true },
      { text: 'AI insights + automation', included: true },
      { text: 'White-label reporting', included: true },
      { text: 'Accountant API access', included: true },
      { text: 'Priority support', included: true }
    ]
  }
];

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  const handleUpgrade = async (tier) => {
    setLoading(true);
    try {
      await base44.auth.updateMe({ plan_tier: tier });
      setUser({ ...user, plan_tier: tier });
      toast.success(`Successfully upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`);
    } catch (error) {
      toast.error('Failed to upgrade. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-[#5E5240] mb-4">
          Choose Your Plan
        </h1>
        <p className="text-[#5E5240]/60 text-lg">
          Scale your creator business with the right tools
        </p>
      </div>

      {/* Current Plan Badge */}
      {user && (
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#208D9E]/10 rounded-full">
            <Crown className="w-4 h-4 text-[#208D9E]" />
            <span className="text-sm font-medium text-[#208D9E]">
              Current Plan: {user.plan_tier?.charAt(0).toUpperCase() + user.plan_tier?.slice(1)}
            </span>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {PLANS.map((plan) => (
          <div
            key={plan.tier}
            className={`clay-card p-6 flex flex-col relative ${
              plan.tier === 'pro' ? 'ring-2 ring-[#208D9E] transform scale-105' : ''
            }`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="px-3 py-1 bg-[#208D9E] text-white text-xs font-semibold rounded-full">
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-[#5E5240] mb-2">{plan.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-[#208D9E]">${plan.price}</span>
                <span className="text-[#5E5240]/60">/month</span>
              </div>
              <p className="text-sm text-[#5E5240]/60">{plan.description}</p>
              
              {plan.annualPrice && (
                <div className="mt-3 p-2 bg-green-50 rounded-lg">
                  <div className="text-xs text-green-800">
                    <Zap className="w-3 h-3 inline mr-1" />
                    Annual: ${plan.annualPrice}/yr (save ${plan.annualSavings})
                  </div>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="flex-grow mb-6">
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-[#208D9E] flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-[#5E5240]/20 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-[#5E5240]' : 'text-[#5E5240]/40'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button */}
            <Button
              onClick={() => handleUpgrade(plan.tier)}
              disabled={loading || user?.plan_tier === plan.tier}
              className={
                user?.plan_tier === plan.tier
                  ? 'btn-secondary w-full cursor-not-allowed'
                  : plan.tier === 'pro'
                  ? 'btn-primary w-full'
                  : 'btn-secondary w-full'
              }
            >
              {user?.plan_tier === plan.tier
                ? 'Current Plan'
                : plan.tier === 'free'
                ? 'Downgrade'
                : 'Upgrade Now'}
            </Button>
          </div>
        ))}
      </div>

      {/* Billing Info */}
      {user && user.plan_tier !== 'free' && (
        <div className="clay-card p-6">
          <h2 className="text-lg font-semibold text-[#5E5240] mb-4">Billing Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#5E5240]/60">Current Plan:</span>
              <div className="font-semibold mt-1">
                {user.plan_tier?.charAt(0).toUpperCase() + user.plan_tier?.slice(1)}
              </div>
            </div>
            <div>
              <span className="text-[#5E5240]/60">Next Billing Date:</span>
              <div className="font-semibold mt-1">Jan 15, 2026</div>
            </div>
            <div>
              <span className="text-[#5E5240]/60">Payment Method:</span>
              <div className="font-semibold mt-1">•••• 4242</div>
            </div>
            <div>
              <span className="text-[#5E5240]/60">Status:</span>
              <div className="font-semibold mt-1 text-green-600">Active</div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button className="btn-secondary">Update Payment Method</Button>
            <Button className="btn-secondary">View Invoice History</Button>
          </div>
        </div>
      )}
    </div>
  );
}