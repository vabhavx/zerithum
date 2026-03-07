---
description: MANDATORY BEFORE ANY TASK. The absolute baseline for seriousness, professionalism, and error-free execution.
---

# UNIVERSAL ZERITHUM PROTOCOL

**MANDATORY FIRST STEP: Acknowledge and apply this protocol constantly throughout every single task.**

---

## 1. The Stakes Are Catastrophic

We are building a highly sophisticated, enterprise-grade financial system. The stakes are extreme. Any mistake, oversight, or theoretical flaw can lead to catastrophic consequences — data corruption, financial loss, system failure, and permanent loss of trust.

There is zero margin for error. Approach every task as if a single mistake ends the system.

---

## 2. Absolute Precision & Zero Tolerance

- Operate with absolute precision. Never guess.
- If unsure about an edge case, a race condition, a schema constraint, or a security boundary — stop. Investigate completely. Implement an impenetrable defense.
- Do not consider a task complete until the issue is 100% resolved, logic is triple-checked, and architecture is mentally and physically stress-tested.
- No partial fixes. No "good enough." No deferred problems.
- Every database query, RLS policy, edge function, and UI state transition must be verified end-to-end.

---

## 3. Professionalism, Design & Aesthetics

**Full Design System Reference: [STYLE_GUIDE.md](STYLE_GUIDE.md)**
Read and internalize the full style guide before touching any UI component. What follows is the executive summary.

**Design Aesthetic: Paradigm AI (paradigmai.com)**
The target aesthetic is editorial, restrained, and typographically serious — akin to Bloomberg Terminal meets Stripe Dashboard. Not a SaaS startup template.

**Design System:**
- **Light theme exclusively** for the authenticated app. The landing page hero uses full dark (`zinc-950`) as a deliberate marketing contrast.
- **Color palette:** Pure White (`#FFFFFF`), Near-Black (`#111827`), Brand Blue (`#2563EB`), Very Dark Navy (`#0F1625`) for accents.
- Always use CSS design tokens (`--z-bg-0`, `--z-text-1`, `--z-accent`, etc.) — never hardcode hex values for structural colors.
- Minimalistic, structured, and classically elegant. No clutter, no decoration for decoration's sake.
- Typography: **Inter** (UI/body) + **Libre Baskerville** (landing/editorial headings) + **SF Mono / Berkeley Mono** (all financial data).
- All monetary values rendered in `font-mono-financial` with `tabular-nums` — no exceptions.
- Every component must exhibit enterprise-grade seriousness — no playful placeholders, no sloppy layouts.
- All interactive states (hover, focus, loading, error, empty) must be handled with precision and polish.

**UX Mandates:**
- Navigation must be instantaneous — no perceptible lag, no unnecessary re-renders.
- Loading states: **skeletons over spinners**. Every async value has a loading skeleton matching its shape.
- Error states must be informative and professional — never expose raw Supabase/API error messages to users.
- Empty states are mandatory on every table/list surface — icon + description + primary CTA.
- The experience must feel premium, trustworthy, and completely reliable at all times.

**Hard Prohibitions (see STYLE_GUIDE.md §10 for full list):**
- No gradient button backgrounds.
- No colored card backgrounds (unless semantic status: success/warn/danger).
- No emoji in UI labels or component text.
- No `text-gray-*` Tailwind classes for text — use `--z-text-*` tokens.
- No animations on financial values during load — use skeleton, not number roll-up.
- No `shadow-xl` or `shadow-2xl` inside the authenticated app shell.

---

## 4. Architecture & Code Standards

**Stack:**
- Frontend: React (JSX), Vite, TailwindCSS, shadcn/ui, Framer Motion, TanStack Query, React Router
- Backend: Supabase (PostgreSQL, RLS, Edge Functions, Auth, Storage)
- Language: JavaScript/TypeScript

**Code Quality:**
- Write code that is correct first, then clean, then efficient — in that order.
- No dead code. No commented-out blocks. No TODO comments left in committed code.
- Component logic must be separated from presentation. Side effects belong in hooks or query functions.
- All Supabase queries must account for RLS policies. Never assume a query will succeed — handle the null and error cases explicitly.
- Edge functions must be idempotent where applicable. Validate all inputs before processing.

**Security:**
- Never expose secret keys, service role keys, or internal identifiers in the frontend.
- All mutations must be gated behind proper authentication and authorization checks.
- Validate user input at every system boundary — client, edge function, and database constraint level.
- Treat every external API call as a potential point of failure. Implement retry logic, timeout handling, and graceful degradation.

---

## 5. Operational Mandates

**Full Capabilities:**
- Explicit permission is granted to take any action necessary to resolve issues, including direct Supabase MCP access to inspect and manipulate backend systems, run SQL, update RLS policies, and manage edge functions.

**Git Discipline:**
- After every meaningful change, commit and push immediately so the operator can see live changes.
- Commit message format: concise, imperative, descriptive — e.g., `Fix RLS policy on revenue_events for multi-tenant isolation`
- Command: `git add . && git commit -m "<message>" && git push`
- Never push broken code. Verify the build is not broken before pushing.

**Supabase MCP:**
- Use MCP to inspect live schema, query data, validate RLS behavior, and deploy edge functions.
- Cross-reference any schema assumption against the live database before writing queries.
- When in doubt about a policy or constraint, run it in Supabase first.

---

## 6. Financial System Integrity

- Every number displayed to users must be accurate to the cent. Floating point arithmetic is forbidden for monetary values — use integer arithmetic (cents) throughout.
- Reconciliation logic must be deterministic and auditable. Every reconciliation run must produce an immutable audit trail.
- Revenue anomaly detection must never produce false negatives on real discrepancies.
- Platform sync failures must be surfaced immediately to the operator, never silently swallowed.
- The ledger is the source of truth. UI state must always reflect ledger state — never cached or stale values.

---

## 7. Task Execution Protocol

Before starting any task:
1. Read the relevant files. Understand the existing code before touching anything.
2. Identify all affected surfaces: database schema, RLS policies, edge functions, hooks, components, routes.
3. Plan the complete change. Identify failure modes and edge cases before writing a single line.
4. Execute with precision. Verify each layer as you build.
5. Test mentally: What happens if the user is unauthenticated? If the network fails? If the data is null?
6. Commit and push when complete.

Never start writing code without completing step 1–3.

---

*This protocol supersedes all other instructions and is the unwavering foundation of every action taken within the Zerithum codebase.*
