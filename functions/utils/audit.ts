/**
 * Standardized Audit Logging for Zerithum Platform
 *
 * Emits JSON structured logs to stdout, which are captured by the platform's logging infrastructure.
 * Follows the "Traceability" core value.
 */

export interface AuditLog {
  timestamp: string;
  actor_id?: string;
  action_type: string;
  status: 'success' | 'failure' | 'error';
  target_resource?: string;
  target_id?: string;
  details?: Record<string, any>;
  error_message?: string;
  duration_ms?: number;
}

/**
 * Emits an audit log entry.
 * @param entry The audit log entry details.
 */
export function logAudit(entry: Omit<AuditLog, 'timestamp'>) {
  const logEntry: AuditLog = {
    timestamp: new Date().toISOString(),
    ...entry
  };

  // In Deno Deploy / Serverless, console.log is captured.
  // We use JSON.stringify to ensure it's parseable by log aggregators.
  console.log(JSON.stringify(logEntry));
}
