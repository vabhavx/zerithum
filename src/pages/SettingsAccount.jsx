import React from "react";
import { User } from "lucide-react";

export default function SettingsAccount() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-[#5E5240] mb-8">Account Settings</h1>
      
      <div className="clay-card">
        <div className="flex items-center gap-2 text-[#5E5240]/60 py-8 justify-center">
          <User className="w-5 h-5" />
          <p>Account settings coming soon</p>
        </div>
      </div>
    </div>
  );
}