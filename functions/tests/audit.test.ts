import { describe, it, expect, vi } from 'vitest';
import { logAudit, AuditLogEntry } from '../utils/audit.ts';

describe('logAudit', () => {
  it('should log to console when base44 client is null', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const entry: AuditLogEntry = {
      action: 'test_action',
      status: 'success',
      details: { foo: 'bar' }
    };

    await logAudit(null, entry);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"action":"test_action"'));
    consoleSpy.mockRestore();
  });

  it('should log to console and persist to DB when base44 client is provided', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const mockCreate = vi.fn().mockResolvedValue({});
    const mockBase44 = {
      asServiceRole: {
        entities: {
          AuditLog: {
            create: mockCreate
          }
        }
      }
    };

    const entry: AuditLogEntry = {
      action: 'db_test',
      status: 'success',
      actor_id: 'user_1'
    };

    await logAudit(mockBase44, entry);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('"action":"db_test"'));
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      action: 'db_test',
      status: 'success',
      actor_id: 'user_1',
      event_type: 'audit'
    }));

    consoleSpy.mockRestore();
  });

  it('should handle DB errors gracefully (log error to console but not throw)', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockCreate = vi.fn().mockRejectedValue(new Error('DB Error'));
    const mockBase44 = {
      asServiceRole: {
        entities: {
          AuditLog: {
            create: mockCreate
          }
        }
      }
    };

    const entry: AuditLogEntry = {
      action: 'fail_test',
      status: 'failure'
    };

    await expect(logAudit(mockBase44, entry)).resolves.not.toThrow();

    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to persist audit log:', expect.any(Error));

    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
});
