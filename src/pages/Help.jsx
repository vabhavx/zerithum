import React from "react";
import { Mail, Book, MessageCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUPPORT_EMAIL = "support@zerithum.com";

const cards = [
  {
    icon: Book,
    title: "Documentation",
    description:
      "Step-by-step guides for connecting platforms, syncing data, understanding your revenue, and exporting reports.",
    action: null,
    actionLabel: "Coming soon",
    disabled: true,
  },
  {
    icon: Mail,
    title: "Email Support",
    description:
      "Send us a message and we will respond within 24 hours on business days.",
    action: `mailto:${SUPPORT_EMAIL}`,
    actionLabel: SUPPORT_EMAIL,
    disabled: false,
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    description: "Real-time support for Pro plan subscribers. Log in to access live chat from your account settings.",
    action: null,
    actionLabel: "Pro plan required",
    disabled: true,
  },
];

export default function Help() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Help & Support</h1>
        <p className="text-gray-500 mt-1 text-sm">Get in touch or find answers to common questions.</p>
      </div>

      <div className="grid gap-4">
        {cards.map(({ icon: Icon, title, description, action, actionLabel, disabled }) => (
          <div key={title} className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{description}</p>
                {action ? (
                  <a href={action} className="inline-flex">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium"
                    >
                      {actionLabel}
                      <ExternalLink className="w-3 h-3 ml-1.5" />
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    className="h-8 border-gray-200 text-gray-400 text-xs font-medium cursor-not-allowed"
                  >
                    {actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
