import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    q: 'What is Zerithum?',
    a: 'Zerithum is a revenue reconciliation platform for creators. It connects your revenue platforms and your bank account, matches payouts to deposits, and produces tax-ready exports.',
  },
  {
    q: 'Can Zerithum move my money?',
    a: 'No. Zerithum is entirely read-only. We connect to your bank via Teller in read-only mode. We cannot initiate transactions, transfers, or withdrawals.',
  },
  {
    q: 'What platforms do you support?',
    a: 'YouTube, Stripe, Patreon, Gumroad, Shopify, Substack, Twitch, and more. We are adding new integrations regularly.',
  },
  {
    q: 'How does reconciliation work?',
    a: 'Zerithum pulls payout data from your connected platforms and deposit data from your bank. It matches them based on amount, timing, and reference data. When something does not match, it flags the discrepancy with a reason code.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. All data is encrypted at rest and in transit. We use OAuth with minimal permissions, and bank connections are read-only via Teller. We never store bank login credentials.',
  },
  {
    q: 'How much does Zerithum cost?',
    a: 'Zerithum starts at $9/month for up to 3 platform connections. The Pro plan is $20/month for up to 5 connections.',
  },
  {
    q: 'Do I need an accountant to use Zerithum?',
    a: 'No. Zerithum is designed for creators to use directly. But if you work with an accountant, the exports are formatted for professional handoff.',
  },
];

function FAQItem({ faq }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-zinc-800/60">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-base text-white font-medium pr-4">{faq.q}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-zinc-500 flex-shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-60 pb-5' : 'max-h-0'
        )}
      >
        <p className="text-sm text-zinc-400 leading-relaxed pr-8">{faq.a}</p>
      </div>
    </div>
  );
}

export default function FAQSection() {
  return (
    <section id="faq" className="py-20 md:py-32 bg-zinc-950">
      <motion.div
        className="max-w-3xl mx-auto px-4 md:px-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight mb-12">
          Common questions
        </h2>

        <div>
          {FAQS.map((faq, i) => (
            <FAQItem key={i} faq={faq} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
