// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

describe('Footer Component', () => {
    it('should not display "San Francisco, CA." and should not display "Security" link in Legal section', () => {
        render(
            <MemoryRouter>
                <Footer />
            </MemoryRouter>
        );

        // Check for absence of "San Francisco, CA."
        const sfText = screen.queryByText(/San Francisco, CA/i);
        expect(sfText).not.toBeInTheDocument();

        // Check for absence of "Security" link under Legal section
        // Note: There is another "Security" link in Product section which points to "#security"
        // The one we want to remove points to "/security"

        // Let's verify if queryByRole supports href filter correctly.
        // It does not directly support href filter in standard aria query, but we can filter manually.
        const allSecurityLinks = screen.queryAllByRole('link', { name: /Security/i });
        const securityLinkHref = allSecurityLinks.find(link => link.getAttribute('href') === '/security');

        expect(securityLinkHref).toBeUndefined();
    });
});
