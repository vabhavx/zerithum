import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Download, Trash2 } from 'lucide-react';

export default function SettingsPrivacy() {
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Privacy & Data</h1>
        <p className="text-[#5E5240]/60">Manage your data and privacy settings</p>
      </div>

      <div className="space-y-6">
        <div className="clay-card p-6">
          <div className="flex items-start gap-3 mb-4">
            <Shield className="w-5 h-5 text-[#208D9E] mt-1" />
            <div>
              <h2 className="font-semibold text-[#5E5240] mb-2">Data Encryption</h2>
              <p className="text-sm text-[#5E5240]/60">
                All your OAuth tokens and API keys are encrypted using AES-256 encryption.
                Your revenue data is stored securely and never shared with third parties.
              </p>
            </div>
          </div>
        </div>

        <div className="clay-card p-6">
          <h2 className="font-semibold text-[#5E5240] mb-4">Export Your Data</h2>
          <p className="text-sm text-[#5E5240]/60 mb-4">
            Download all your data in a portable format
          </p>
          <Button className="btn-secondary">
            <Download className="w-4 h-4 mr-2" />
            Export All Data
          </Button>
        </div>

        <div className="clay-card p-6 border-[#C0152F]/20">
          <h2 className="font-semibold text-[#C0152F] mb-4">Danger Zone</h2>
          <p className="text-sm text-[#5E5240]/60 mb-4">
            Delete your account and all associated data. This action cannot be undone.
          </p>
          <Button className="btn-danger">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}