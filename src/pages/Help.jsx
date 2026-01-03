import React from "react";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, BookOpen, ExternalLink } from "lucide-react";

export default function Help() {
  const helpItems = [
    {
      icon: BookOpen,
      title: "Documentation",
      description: "Learn how to use Zerithum with our comprehensive guides",
      action: "View Docs",
      link: "#",
    },
    {
      icon: MessageCircle,
      title: "Live Chat Support",
      description: "Get instant help from our support team",
      action: "Start Chat",
      link: "#",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us an email and we'll respond within 24 hours",
      action: "Send Email",
      link: "mailto:support@zerithum.com",
    },
  ];

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Help & Support</h1>
        <p className="text-[#5E5240]/60">We're here to help you succeed</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {helpItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="clay-card text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-[#208D9E]/10 flex items-center justify-center">
                <Icon className="w-6 h-6 text-[#208D9E]" />
              </div>
              <h3 className="font-bold text-[#5E5240] mb-2">{item.title}</h3>
              <p className="text-sm text-[#5E5240]/60 mb-4">{item.description}</p>
              <a href={item.link}>
                <Button className="btn-primary w-full text-sm">
                  {item.action}
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              </a>
            </div>
          );
        })}
      </div>

      <div className="clay-card">
        <h3 className="font-bold text-[#5E5240] mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-[#5E5240] mb-1">How do I connect a new platform?</h4>
            <p className="text-sm text-[#5E5240]/60">
              Go to Connected Platforms, click "Connect" on any platform card, and follow the OAuth flow.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#5E5240] mb-1">How often does data sync?</h4>
            <p className="text-sm text-[#5E5240]/60">
              By default, platforms sync daily at 6-10 AM UTC. You can also manually sync anytime.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-[#5E5240] mb-1">Is my data secure?</h4>
            <p className="text-sm text-[#5E5240]/60">
              Yes. All tokens are encrypted with AES-256, and we never store your platform passwords.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}