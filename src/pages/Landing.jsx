import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LandingWedge from '@/components/landing/LandingWedge';
import { FEATURES } from '@/data/mock_landing';
import { ArrowRight, Check, Shield, Database, Lock } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-foreground selection:text-background">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border">
         <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-xs">Z</div>
            <span className="font-serif font-bold text-lg tracking-tight">Zerithum</span>
         </div>
         <div className="flex items-center gap-4">
             <Link to="/SignIn">
                <Button variant="ghost" size="sm" className="text-xs font-mono uppercase tracking-wider">Log In</Button>
             </Link>
             <Link to="/Signup">
                <Button variant="default" size="sm" className="hidden sm:flex text-xs font-mono uppercase tracking-wider">Start Now</Button>
             </Link>
         </div>
      </nav>

      {/* Hero Section - High Contrast, Serif */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-20 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-grid-subtle opacity-20 pointer-events-none"></div>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-5xl mx-auto z-10"
        >
            <Badge variant="outline" className="mb-6 border-border text-muted-foreground font-mono uppercase tracking-[0.2em] py-1 px-3">
                Financial Infrastructure v2.0
            </Badge>

            <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-normal tracking-tight leading-[0.9] text-foreground mb-8">
                The Truth About<br />
                <span className="italic font-light opacity-90">Your Revenue</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 font-light">
                Platforms report what they earned. Banks report what you received.<br className="hidden md:block"/>
                Zerithum reconciles the difference, creating an immutable audit trail for the serious creator economy.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/Signup">
                    <Button size="lg" className="h-14 px-8 text-sm font-semibold tracking-wide">
                        Deploy Infrastructure <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </Link>
                <Link to="/SignIn">
                    <Button variant="outline" size="lg" className="h-14 px-8 text-sm font-semibold tracking-wide border-input bg-transparent hover:bg-muted">
                        View Demo
                    </Button>
                </Link>
            </div>
        </motion.div>
      </section>

      {/* The Wedge Section - Visual Proof */}
      <section className="py-24 px-6 bg-card border-y border-border relative">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
              <div>
                  <h2 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">
                      The Reconciliation Wedge
                  </h2>
                  <div className="w-24 h-1 bg-foreground mb-8"></div>
                  <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      Most dashboards are fiction. They report gross earnings before fees, holds, and refunds.
                      Your bank account is reality.
                  </p>
                  <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                      The gap between them is the "Wedge". It contains lost revenue, hidden fees, and tax liabilities.
                      We automate the forensic accounting required to close it.
                  </p>

                  <ul className="space-y-4 font-mono text-sm text-muted-foreground">
                      <li className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Platform-to-Bank automated matching</span>
                      </li>
                      <li className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Fee and Refund isolation</span>
                      </li>
                      <li className="flex items-center gap-3">
                          <Check className="w-4 h-4 text-primary" />
                          <span>Audit-ready export formats</span>
                      </li>
                  </ul>
              </div>

              <div className="relative">
                  {/* Abstract structural lines */}
                  <div className="absolute -inset-4 border border-border opacity-50 z-0"></div>
                  <div className="absolute -inset-2 border border-border opacity-30 z-0"></div>
                  <div className="relative z-10 shadow-2xl bg-background">
                      <LandingWedge />
                  </div>
              </div>
          </div>
      </section>

      {/* Features Grid - Dense & Technical */}
      <section className="py-24 px-6 bg-background">
          <div className="max-w-7xl mx-auto">
              <div className="mb-16">
                  <h2 className="text-3xl md:text-4xl font-serif mb-4">Core Architecture</h2>
                  <p className="text-muted-foreground font-mono uppercase tracking-wider text-sm">System Capabilities</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border">
                  {FEATURES.map((feature, idx) => (
                      <div key={idx} className="bg-background p-8 hover:bg-muted/5 transition-colors group">
                          <div className="mb-6 w-10 h-10 border border-border flex items-center justify-center text-foreground group-hover:border-foreground transition-colors">
                              {/* Simple icon mapping based on mock data strings, or default */}
                              {feature.icon === 'Lock' && <Lock className="w-5 h-5" />}
                              {feature.icon === 'Landmark' && <Database className="w-5 h-5" />}
                              {feature.icon === 'Activity' && <Shield className="w-5 h-5" />}
                              {feature.icon === 'FileText' && <Check className="w-5 h-5" />}
                          </div>
                          <h3 className="text-lg font-bold font-serif mb-3 group-hover:text-primary transition-colors">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                              {feature.description}
                          </p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Final CTA - Serious */}
      <section className="py-32 px-6 bg-foreground text-background text-center relative overflow-hidden">
          <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-5xl md:text-7xl font-serif mb-8 leading-none">
                  Stop Guessing. <br/>
                  Start Auditing.
              </h2>
              <p className="text-lg md:text-xl opacity-80 mb-10 max-w-xl mx-auto font-light">
                  Join the creators who treat their business like a corporation.
                  Professional grade reconciliation is now standard.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                   <Link to="/Signup">
                        <Button size="lg" className="h-16 px-10 text-base bg-background text-foreground hover:bg-background/90 border-transparent">
                            Create Account
                        </Button>
                   </Link>
              </div>
              <div className="mt-16 pt-8 border-t border-background/20 flex justify-between text-[10px] font-mono uppercase tracking-widest opacity-60">
                   <span>© 2024 Zerithum Inc.</span>
                   <span>System Status: Operational</span>
              </div>
          </div>
      </section>

    </div>
  );
}
