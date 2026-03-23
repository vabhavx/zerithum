import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 bg-zinc-950">
      <motion.div
        className="max-w-3xl mx-auto px-4 md:px-6 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight mb-8">
          Stop guessing where your money went.
        </h2>
        <Link to="/Signup">
          <Button
            size="lg"
            className="bg-white text-zinc-900 hover:bg-zinc-200 font-medium px-10 h-12 rounded-full text-base"
          >
            Create your account
          </Button>
        </Link>
      </motion.div>
    </section>
  );
}
