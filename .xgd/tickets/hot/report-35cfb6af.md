---
uid: report-35cfb6af
id: REPORT-534
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-07-13T21:43:25.173134+00:00'
updated_at: '2026-07-13T21:43:25.173134+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-d9c2e655
---

All fixes are applied. Per the mission instructions ("Do NOT run quality checks — the workflow runs them automatically after this step"), I won't run the suite; the workflow re-runs quality and re-review next.

## Summary

### Issues fixed

**Critical (required) — undefined `--color-accent-mid` for the footer `accent-muted` surface**
- `packages/framework/src/tokens/defaults.ts:26` — Added `accentMid: '#d98324'` to `defaultTokens.palette`, a muted gold between `accent` (`#f59e0b`) and `accentDeep` (`#b45309`), with a comment mirroring the accentLight/accentDeep precedent. `accentMid` is already an optional role in the site-schema `PaletteTokens` (schema.ts:549), so this type-checks and makes `paletteVars` emit `--color-accent-mid` in `:root` unconditionally. The footer rule `.footer.surface-accent-muted { background: var(--color-accent-mid) }` now resolves out-of-the-box.

**Recommended — test only proved the reference, not resolution**
- `tests/req36-heading-treatment.test.ts:757` — Strengthened `test_UAT_FC_REQ-36_footer_accent_muted_uses_the_mid_gold` to also assert `generateThemeCss({})` (defaults, no site palette) declares `--color-accent-mid:` inside `:root`. This catches the exact class of gap the reviewer flagged — the var must resolve, not merely be referenced.

**Warning — CSS-injection defense-in-depth in `resolveFamily`**
- `packages/framework/src/modules/text-style.ts:189` — Literal family names now escape `\` and `"` before quoting. Role aliases and quote/backslash-free names (e.g. `"Oswald", sans-serif`) are byte-for-byte unchanged, so no existing behaviour shifts.

**Nit — dead code**
- `tools/generate/src/conformance/checks.ts:243` — Removed the unused `const innerWidth = window.innerWidth;` from the `RESPONSIVE_PROBE` template.

### Confidence

High. The one blocking Critical is resolved by adding the missing default token (the same pattern as its siblings), and the strengthened test now enforces the invariant so this can't silently regress. The two remaining Nits (pill/badge geometry mirror, `.fc-band` accent-muted rule) were flagged as non-blocking edge cases, and the two behavioural notes (unclosed-marker leniency, `resolveFamily`) were either intentional or now hardened. No stories/ACs/UATs were mutated and no tests were weakened. All changes are surgical and localized.
