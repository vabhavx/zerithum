
export interface AuditLogEntry {
  action: string;
  actor_id?: string;
  resource_id?: string;
  resource_type?: string;
  status: 'success' | 'failure' | 'warning';
  details?: Record<string, any>;
  timestamp?: string;
}

export function logAudit(entry: AuditLogEntry): void {
  const logEntry = {
    timestamp: entry.timestamp || new Date().toISOString(),
    event_type: 'audit',
    ...entry
  };

  // Emit structured JSON log to stdout
  console.log(JSON.stringify(logEntry));
}
