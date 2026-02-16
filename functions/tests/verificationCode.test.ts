import { describe, it, expect } from 'vitest';
import { getVerificationEmailHtml, VerificationPurpose } from '../templates/verificationCode.ts';

describe('getVerificationEmailHtml', () => {
    it('should generate email for password_change', () => {
        const purpose: VerificationPurpose = 'password_change';
        const code = '123456';
        const html = getVerificationEmailHtml(purpose, code);

        expect(html).toContain('Password Change Verification');
        expect(html).toContain('change your password');
        expect(html).toContain('123456');
    });

    it('should generate email for delete_account', () => {
        const purpose: VerificationPurpose = 'delete_account';
        const code = '654321';
        const html = getVerificationEmailHtml(purpose, code);

        expect(html).toContain('Account Deletion Verification');
        expect(html).toContain('delete your account');
        expect(html).toContain('654321');
    });

    it('should generate email for revoke_sessions', () => {
        const purpose: VerificationPurpose = 'revoke_sessions';
        const code = '999999';
        const html = getVerificationEmailHtml(purpose, code);

        expect(html).toContain('Sign Out All Devices Verification');
        expect(html).toContain('sign out from all devices');
        expect(html).toContain('999999');
    });
});
