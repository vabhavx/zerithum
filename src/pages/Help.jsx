import React from 'react';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle, Book, ExternalLink } from 'lucide-react';

export default function Help() {
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Help & Support</h1>
        <p className="text-[#5E5240]/60">Get help with Zerithum</p>
      </div>

      <div className="grid gap-6">
        <div className="clay-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#208D9E]/10 rounded-lg flex items-center justify-center">
              <Book className="w-6 h-6 text-[#208D9E]" />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-[#5E5240] mb-2">Documentation</h3>
              <p className="text-sm text-[#5E5240]/60 mb-4">
                Learn how to connect platforms, sync data, and export reports
              </p>
              <Button className="btn-secondary text-sm">
                View Docs <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="clay-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#208D9E]/10 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#208D9E]" />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-[#5E5240] mb-2">Email Support</h3>
              <p className="text-sm text-[#5E5240]/60 mb-4">
                Get help via email. We typically respond within 24 hours.
              </p>
              <Button className="btn-secondary text-sm">
                support@zerithum.com <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        <div className="clay-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#208D9E]/10 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-[#208D9E]" />
            </div>
            <div className="flex-grow">
              <h3 className="font-semibold text-[#5E5240] mb-2">Live Chat</h3>
              <p className="text-sm text-[#5E5240]/60 mb-4">
                Chat with our support team (Pro and Max plans only)
              </p>
              <Button className="btn-primary text-sm">
                Start Chat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}