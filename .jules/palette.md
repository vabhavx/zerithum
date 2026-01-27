## 2025-05-18 - Global Tooltip Provider
**Learning:** Shadcn UI Tooltip components require a `TooltipProvider` to be present in the component tree. It was missing from `App.jsx`, preventing tooltips from rendering.
**Action:** Ensure `TooltipProvider` wraps the application root in `App.jsx` when adding new Tooltip-dependent features.
