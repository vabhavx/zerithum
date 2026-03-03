# Zerithum Platform Architecture

## Overview

Zerithum is a comprehensive fintech platform for revenue reconciliation, tax estimation, and financial analytics designed for creators and digital entrepreneurs.

## Tech Stack

### Frontend
- **Framework**: React 18.2+ with Suspense and Concurrent Features
- **Build Tool**: Vite 6.1+ for fast development and optimized builds
- **Styling**: Tailwind CSS 3.4+ with custom design system
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: React Router v6
- **Animation**: Framer Motion + GSAP
- **Charts**: Recharts with custom optimizations

### Backend
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth with OAuth providers
- **Edge Functions**: Deno/TypeScript for serverless logic
- **Storage**: Supabase Storage for receipts and exports
- **Realtime**: Supabase Realtime for live updates

### Infrastructure
- **Hosting**: Vercel with edge caching
- **CDN**: Cloudflare for static assets
- **CI/CD**: GitHub Actions
- **Monitoring**: Custom analytics layer

## Core Features

### 1. Dashboard
- Real-time revenue analytics
- Platform breakdown visualization
- Performance metrics and trends
- Actionable insights panel

### 2. Tax Estimator
- Quarterly tax calculations
- Federal and state tax brackets
- Self-employment tax computation
- Confidence scoring based on data completeness
- PDF report generation

### 3. Expense Management
- Receipt upload and OCR
- Category-based tracking
- Tax-deductible flagging
- Bulk import/export

### 4. Revenue Autopsy
- AI-powered anomaly detection
- Causal reconstruction analysis
- Platform behavior analysis
- Risk exposure scoring

### 5. Platform Integrations
- YouTube Analytics
- Patreon
- Stripe
- Gumroad
- Instagram
- TikTok
- Shopify
- Substack

### 6. Reconciliation
- Automatic transaction matching
- Bank statement sync
- Fee deduction tracking
- Hold period detection

## Architecture Layers

### Performance Layer (`src/lib/performance.js`)
- LRU Cache implementation
- Virtual list rendering
- Data downsampling for charts
- Memory management
- Web Worker integration

### Error Handling Layer (`src/lib/errorHandling.js`)
- Global error boundaries
- Error classification system
- Retry logic with exponential backoff
- Network status monitoring
- Graceful degradation

### Security Layer (`src/lib/security.js`)
- Input sanitization
- XSS prevention
- CSRF protection
- Rate limiting
- Secure storage
- Password strength validation

### Caching Layer (`src/lib/cache.js`)
- Multi-tier caching (Memory + IndexedDB)
- Service Worker cache integration
- Background sync
- Cache invalidation strategies

### Analytics Layer (`src/lib/analytics.js`)
- Privacy-focused tracking
- Core Web Vitals monitoring
- Performance metrics
- Error tracking
- Feature detection

### Accessibility Layer (`src/lib/accessibility.js`)
- Focus trap management
- Screen reader announcements
- Keyboard navigation
- ARIA helpers
- Reduced motion support

### Real-time Layer (`src/lib/realtime.js`)
- WebSocket management
- Server-Sent Events
- Supabase Realtime integration
- Presence tracking
- Optimistic updates

### PWA Layer (`src/lib/pwa.js`, `public/sw.js`)
- Service Worker registration
- Offline support
- Background sync
- Push notifications
- App manifest

## Project Structure

```
/src
  /api              # API clients and utilities
  /components       # React components
    /ui             # Base UI components
    /dashboard      # Dashboard-specific
    /expense        # Expense management
    /tax            # Tax estimator
    /autopsy        # Revenue autopsy
    /landing        # Landing page sections
    /shared         # Shared components
  /hooks            # Custom React hooks
  /lib              # Core utilities and layers
  /pages            # Page components
  /utils            # Helper functions
/functions          # Supabase Edge Functions
  /logic            # Business logic
  /tests            # Function tests
  /utils            # Shared utilities
/public             # Static assets
```

## Key Optimizations

### 1. Rendering Performance
- Component memoization
- Virtual scrolling for large lists
- Progressive chart rendering
- Lazy loading with Suspense
- Intersection Observer for below-fold content

### 2. Data Fetching
- TanStack Query for caching
- Stale-while-revalidate strategy
- Prefetching on hover
- Optimistic updates
- Background refetching

### 3. Bundle Optimization
- Route-based code splitting
- Dynamic imports
- Tree shaking
- Asset compression
- CDN distribution

### 4. Memory Management
- LRU cache eviction
- Large dataset warnings
- Automatic cleanup
- Image lazy loading
- Component unmount cleanup

## Testing Strategy

### Unit Tests
- Vitest for JavaScript/TypeScript
- React Testing Library for components
- 80%+ code coverage target

### Integration Tests
- API integration tests
- Authentication flow tests
- End-to-end user journeys

### Performance Tests
- Bundle size monitoring
- Lighthouse CI integration
- Core Web Vitals tracking

## Security Measures

1. **Input Validation**: Zod schemas for all inputs
2. **Output Sanitization**: HTML escaping for user content
3. **Authentication**: JWT with refresh tokens
4. **Authorization**: Row Level Security in Supabase
5. **Rate Limiting**: Client and server-side
6. **CSP Headers**: Content Security Policy
7. **HTTPS**: Enforced for all connections

## Development Guidelines

### Code Style
- ESLint with custom rules
- Prettier for formatting
- Conventional commits
- Semantic versioning

### Performance Budget
- Initial bundle < 200KB gzipped
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse score > 90

### Accessibility Requirements
- WCAG 2.1 Level AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast ratios

## Deployment

### Environments
- Development: Local with hot reload
- Staging: Vercel preview deployments
- Production: Vercel with edge caching

### Release Process
1. Feature branch creation
2. Pull request with CI checks
3. Code review approval
4. Merge to main
5. Automatic deployment
6. Post-deploy verification

## Monitoring & Alerting

### Metrics Tracked
- Error rates
- Performance metrics
- User engagement
- API latency
- Database performance

### Alerting Channels
- Email for critical issues
- Slack for team notifications
- PagerDuty for on-call escalation

## Future Roadmap

### Q1 2024
- Mobile app (React Native)
- Advanced AI insights
- Multi-currency support
- Team collaboration features

### Q2 2024
- Accountant portal
- Advanced reporting
- API for third parties
- White-label options

---

*This architecture document is living and should be updated as the platform evolves.*
