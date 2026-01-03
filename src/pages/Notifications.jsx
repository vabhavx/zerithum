import React from 'react';
import { Button } from '@/components/ui/button';

export default function Notifications() {
  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#5E5240] mb-2">Notifications</h1>
        <p className="text-[#5E5240]/60">Manage your notification preferences</p>
      </div>

      <div className="clay-card p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#5E5240]">Email notifications</div>
              <div className="text-sm text-[#5E5240]/60">Receive updates via email</div>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#5E5240]">Sync alerts</div>
              <div className="text-sm text-[#5E5240]/60">Get notified when syncs fail</div>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-[#5E5240]">Weekly revenue summary</div>
              <div className="text-sm text-[#5E5240]/60">Receive weekly revenue reports</div>
            </div>
            <input type="checkbox" className="w-5 h-5" defaultChecked />
          </div>

          <div className="pt-4 border-t border-[#5E524012]">
            <Button className="btn-primary">Save Preferences</Button>
          </div>
        </div>
      </div>
    </div>
  );
}