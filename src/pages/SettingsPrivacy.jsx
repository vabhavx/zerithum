import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Download, Trash2, Loader2, Lock } from 'lucide-react';
import DeleteAccountModal from "@/components/security/DeleteAccountModal";
import { base44 } from '@/api/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function SettingsPrivacy() {
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const [user, transactions, expenses, platforms] = await Promise.all([
        base44.auth.me(),
        base44.entities.RevenueTransaction.list('-transaction_date', 5000).catch(() => []),
        base44.entities.Expense.list('-expense_date', 5000).catch(() => []),
        base44.entities.ConnectedPlatform.list('-connected_at', 100).catch(() => []),
      ]);

      const exportPayload = {
        export_date: new Date().toISOString(),
        account: {
          id: user?.id,
          email: user?.email,
          full_name: user?.full_name,
          created_at: user?.created_at,
        },
        revenue_transactions: transactions,
        expenses,
        connected_platforms: platforms.map((p) => ({
          id: p.id,
          platform: p.platform,
          sync_status: p.sync_status,
          connected_at: p.connected_at,
          last_synced_at: p.last_synced_at,
        })),
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `zerithum-data-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      link.remove();

      toast.success('Data exported successfully');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <DeleteAccountModal open={deleteAccountOpen} onOpenChange={setDeleteAccountOpen} />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Privacy & Data</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your data and privacy settings</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Lock className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 mb-1">Data Encryption</h2>
              <p className="text-sm text-gray-500 leading-relaxed">
                All OAuth tokens and API keys are encrypted at rest using AES-256.
                Your revenue data is stored in isolated, multi-tenant secure storage and
                is never shared with third parties.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Shield className="w-3.5 h-3.5 text-green-500" />
                <span className="text-xs font-medium text-green-600">AES-256 encryption active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-1">Export Your Data</h2>
          <p className="text-sm text-gray-500 mb-4">
            Download a full archive of your account data — transactions, expenses, and
            connected platform metadata — as a structured JSON file.
          </p>
          <Button
            variant="outline"
            onClick={handleExportData}
            disabled={isExporting}
            className="h-9 border-gray-200 text-gray-700 hover:bg-gray-50 text-sm"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? 'Exporting…' : 'Export All Data'}
          </Button>
        </div>

        <div className="rounded-xl border border-red-100 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-red-700 mb-1">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Permanently delete your account and all associated data. This action is
            irreversible and cannot be undone.
          </p>
          <Button
            variant="outline"
            onClick={() => setDeleteAccountOpen(true)}
            className="h-9 border-red-200 text-red-600 hover:bg-red-50 text-sm"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}