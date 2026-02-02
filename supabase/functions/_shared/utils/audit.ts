
export interface AuditLogEntry {
  action: string;
  actor_id?: string;
  resource_id?: string;
  resource_type?: string;
  status: 'success' | 'failure' | 'warning';
  details?: Record<string, any>;
  timestamp?: string;
}

export async function logAudit(base44: any, entry: AuditLogEntry): Promise<void> {
  const logEntry = {
    timestamp: entry.timestamp || new Date().toISOString(),
    event_type: 'audit',
    ...entry
  };

  // Emit structured JSON log to stdout
  console.log(JSON.stringify(logEntry));

  // Persist to database if client is available
  if (base44) {
    try {
      await base44.asServiceRole.entities.AuditLog.create(logEntry);
    } catch (error) {
      console.error('Failed to persist audit log:', error);
      // We don't throw here to avoid failing the main operation just because audit logging failed
      // But we should log the error to stdout
    }
  }
}
