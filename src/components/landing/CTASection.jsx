import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
        <ScrollReveal
          baseOpacity={0.1}
          enableBlur={true}
          baseRotation={3}
          blurStrength={4}
          textClassName="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight"
        >
          Stop guessing where your money went.
        </ScrollReveal>
        <motion.div
          className="relative inline-flex mt-8"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          {/* Subtle radial glow behind button */}
          <div className="absolute inset-0 w-64 h-24 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <Link to="/Signup">
            <Button
              size="lg"
              className="relative bg-white text-zinc-900 hover:bg-zinc-200 font-medium px-10 h-12 rounded-full text-base"
            >
              Create your account
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
