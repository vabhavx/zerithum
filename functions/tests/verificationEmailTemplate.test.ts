
import { describe, it, expect } from 'vitest';
import { getVerificationEmailHtml, PURPOSE_TITLES, PURPOSE_DESCRIPTIONS } from '../templates/verificationEmail.ts';

describe('getVerificationEmailHtml', () => {
    it('should generate correct HTML for password_change', () => {
        const purpose = 'password_change';
        const code = '123456';
        const html = getVerificationEmailHtml(code, purpose);

        expect(html).toContain(PURPOSE_TITLES[purpose]);
        expect(html).toContain(PURPOSE_DESCRIPTIONS[purpose]);
        expect(html).toContain(code);
        expect(html).toContain('🔐 Password Change Verification');
        expect(html).toContain('You requested to <strong>change your password</strong>');
    });

    it('should generate correct HTML for delete_account', () => {
        const purpose = 'delete_account';
        const code = '654321';
        const html = getVerificationEmailHtml(code, purpose);

        expect(html).toContain(PURPOSE_TITLES[purpose]);
        expect(html).toContain(PURPOSE_DESCRIPTIONS[purpose]);
        expect(html).toContain(code);
        expect(html).toContain('🔐 Account Deletion Verification');
        expect(html).toContain('You requested to <strong>delete your account</strong>');
    });

    it('should generate correct HTML for revoke_sessions', () => {
        const purpose = 'revoke_sessions';
        const code = '987654';
        const html = getVerificationEmailHtml(code, purpose);

        expect(html).toContain(PURPOSE_TITLES[purpose]);
        expect(html).toContain(PURPOSE_DESCRIPTIONS[purpose]);
        expect(html).toContain(code);
        expect(html).toContain('🔐 Sign Out All Devices Verification');
        expect(html).toContain('You requested to <strong>sign out from all devices</strong>');
    });

    it('should handle unknown purposes gracefully', () => {
        const purpose = 'unknown_purpose';
        const code = '111111';
        const html = getVerificationEmailHtml(code, purpose);

        expect(html).toContain('Verification'); // Fallback title
        expect(html).toContain('perform this action'); // Fallback description
        expect(html).toContain(code);
    });
});
