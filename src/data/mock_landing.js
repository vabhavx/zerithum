export const MOCK_RECONCILIATION_DATA = [
  {
    id: "REC-2024-001",
    date: "2024-02-15",
    platform: "YouTube",
    platform_amount: 1800.00,
    bank_amount: 1650.00,
    status: "discrepancy",
    discrepancy_reason: "Platform Fee (15%) + Hold",
    audit_log: [
      { timestamp: "2024-02-15 09:00:00", event: "Platform Report Ingested", details: "YouTube API v3" },
      { timestamp: "2024-02-16 10:30:00", event: "Bank Deposit Detected", details: "Chase Manhattan - WIRE" },
      { timestamp: "2024-02-16 10:30:05", event: "Auto-Match Attempt", details: "Failed: Amount Mismatch > 5%" },
      { timestamp: "2024-02-16 14:20:00", event: "Manual Review", details: "User flagged fee deduction" },
    ]
  },
  {
    id: "REC-2024-002",
    date: "2024-02-18",
    platform: "Patreon",
    platform_amount: 1200.00,
    bank_amount: 1150.00,
    status: "matched",
    discrepancy_reason: "Processing Fee",
    audit_log: [
      { timestamp: "2024-02-18 08:00:00", event: "Platform Report Ingested", details: "Patreon CSV" },
      { timestamp: "2024-02-19 11:15:00", event: "Bank Deposit Detected", details: "Stripe Payout" },
      { timestamp: "2024-02-19 11:15:02", event: "Auto-Match Success", details: "Confidence Score: 0.98" },
    ]
  },
  {
    id: "REC-2024-003",
    date: "2024-02-20",
    platform: "Stripe",
    platform_amount: 5000.00,
    bank_amount: 0.00,
    status: "missing_bank",
    discrepancy_reason: "Payout Delay (Holiday)",
    audit_log: [
       { timestamp: "2024-02-20 12:00:00", event: "Platform Report Ingested", details: "Stripe API" },
       { timestamp: "2024-02-22 09:00:00", event: "Anomaly Detected", details: "No matching deposit found within 48h" },
    ]
  }
];

export const FEATURES = [
  {
    title: "Immutable Ledger",
    description: "Every match, dispute, and note is cryptographically hashed and appended. No destructive edits.",
    icon: "Lock"
  },
  {
    title: "Bank Truth Source",
    description: "We treat bank feeds as the primary reality. Platform reports are merely claims until verified.",
    icon: "Landmark"
  },
  {
    title: "Anomaly Detection",
    description: "Statistical models flag payout delays, fee spikes, and phantom refunds automatically.",
    icon: "Activity"
  },
  {
    title: "Tax Taxonomy",
    description: "Multi-jurisdiction categorization for VAT, GST, and Income Tax withholding.",
    icon: "FileText"
  }
];
