---
uid: report-2f16ce41
id: REPORT-936
type: report
title: 'UAT Coverage: Capability Module Contract & Catalog'
created_by: xgd
created_at: '2026-07-24T10:09:23.815089+00:00'
updated_at: '2026-07-24T10:09:23.815089+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-ce902be4
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Capability Module Contract & Catalog

**Result**: PASS
**AC verdicts**: 8 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

The capability's single story (STORY-85 / story-179b8c06) is a feature story
whose `intent_uid` is the merged reconciliation bundle `bundle-31e474b9`
(`merged_at_commit: edeb1c2c`). The bundle is the framework-pivot reconciliation
(REQ-79/REQ-84 pivot; L1 security envelope per REQ-82/DOC-2), which reframed the
former aesthetic "modules" into behavioural **capability modules** and carried
the two survivors forward (carousel v1→v2, contact-form v2→v3). The contact-form
client behaviour is additionally grounded in REQ-5/REQ-85 (free-coded, proven by
`test_UAT_FC_REQ-5_*`).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-31e474b9 (pivot reconciliation: REQ-79/REQ-84/REQ-82 …) | merged | merged @ edeb1c2c | Reframed modules as behavioural capabilities: vetted core + typed config + L1 presentation slots + five-dimension conformance incl. isolation; carousel v2, contact-form v3; shipped-client-JS asset | YES |
| REQ-5 / REQ-85 (contact-form client enhancement) | free-coded (in tree) | — | JSON-fetch progressive enhancement over the no-JS post baseline | YES |

No later intent retires capability modules — they are the current architecture
(CLAUDE.md "Close capability gaps in L1, not with new modules"; DOC-25/DOC-26).
All ACs are therefore **active**.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-85 (story-179b8c06) | bundle-31e474b9 (pivot), REQ-5/REQ-85 | aligned | Story body (config/slots/conformance contract, carousel v2 + contact-form v3 survivors, shipped-client-JS asset, isolation dimension) is fully supported by merged/in-tree intent; nothing retired |

## Findings — Categorized by Editor Action

No violations, warnings, or needs_review items.

Every AC is active per cumulative intent and substantively covered by a test that
invokes the real production entry point and could distinguish a correct from an
incorrect implementation:

| AC | Entry point exercised | Why substantive |
|---|---|---|
| AC-697 | `validateCapabilityConfig` on real `carouselMeta`/`contactFormMeta` + representative int meta | One seeded defect per case; asserts the exact field-scoped violation set (required/type/range/enum/list-bounds/itemSchema recursion) |
| AC-698 | `validateCapabilitySlots` / `validateCapabilityInstance` | Raw-markup string & arbitrary object rejected as "not a valid L1 subtree" (the security line); required/optional, array bounds, array-vs-single both ways, config+slot union |
| AC-699 | Astro container SSR of `Carousel` | Asserts scroll-snap track, one `data-l1-slot="slide"` mount per L1 subtree with verbatim content, `view` sizing classes, dots-per-slide, and that the meta carries no aesthetic dials/variants/contentSchema |
| AC-700 | `advanceTrack` / `enhanceCarousel` from real `client.js` + SSR markers | Drives the vetted algorithm: one-slide-per-tick advance, wrap-only-under-loop, and three isolation branches (one-slide, missing track, absent timer API) never throw / never schedule |
| AC-701 | Astro container SSR of `ContactForm` | No-JS `<form method="post">` to the safe endpoint, one labelled control per field with correct type/required, textarea, honeypot + Turnstile surface, optional L1 intro/submit slots |
| AC-702 | `cmdNew` + `cmdRender` full generate pipeline | Emits exactly one `capabilities.js` folding both capabilities, each page references it once as a module script, no dev-path island `?astro&type=script`, emission gated on `getModuleClientJs()` |
| AC-703 | `assertModuleConforms(..., {dimension:'isolation'})` harness | Positive (degenerate-but-schema-valid input degrades inertly on both survivors) AND negative (a throwing-core fixture is flagged `isolation.render-throws`) — a genuine discriminator |
| AC-704 | Introspection of real `meta.conformance.obligations` | Asserts the runtime contract enumerates exactly {safety, security, x-browser, responsive, isolation} and opts out of none (`except` undefined) — reads the contract data, not source text |

## Notes for the Editor

- **Traceability (informational, not a gap):** the contact-form's JSON-fetch
  progressive-enhancement runtime — a story-body promise symmetric to the
  carousel's AC-700 — is proven by `tests/framework-contact-form-client.test.ts`
  (`test_UAT_FC_REQ-5_*`, JSDOM + mocked `fetch`: submit interception, JSON POST
  body, success inline-swap, non-2xx error surface), which is named under REQ-5
  rather than an AC of this capability. Coverage is substantive; only the
  AC-naming trace is indirect. AC-702's `capsJs.toContain('enhanceAllContactForms')`
  is a shipping/packaging assertion (structural on its own), but it is not the
  evidence for the enhancement's behaviour — the REQ-5 file is. No action needed
  unless the operator wants a dedicated AC for the contact-form client behaviour.
- **Stale UAT index (out of scope):** `.xgd/uat_index.json` lists all eight
  `test_UAT_AC697…704_*` with `status: "missing" / last_run: null`. The test
  files plainly exist and `check_uat_validation` completed `done` on this branch;
  this is the known fresh-regression-worktree stale-index artifact, not a
  coverage gap. Rebuild the index rather than treating the phantom counts as real.

