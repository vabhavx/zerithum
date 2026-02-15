// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
import Footer from './Footer';

expect.extend(matchers);

describe('Footer', () => {
    it('renders correct links', () => {
        render(
            <BrowserRouter>
                <Footer />
            </BrowserRouter>
        );

        expect(screen.getByRole('link', { name: /Terms of Service/i })).toHaveAttribute('href', '/TermsOfService');
        expect(screen.getByRole('link', { name: /Privacy Policy/i })).toHaveAttribute('href', '/Privacy');
        expect(screen.getByRole('link', { name: /Methodology/i })).toHaveAttribute('href', '/Methodology');
    });
});
