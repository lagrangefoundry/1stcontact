---
uid: report-e697688a
id: REPORT-431
type: report
title: 'Reconciliation Review: BUNDLE-4 (commits)'
created_by: xgd
created_at: '2026-07-10T02:13:52.896017+00:00'
updated_at: '2026-07-10T02:13:52.896017+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: bundle-df065afc
  anchor_uid: bundle-df065afc
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Anchor**: bundle-df065afc (BUNDLE-4)
**Subject (intent)**: bundle-df065afc (bundle is a first-class intent type)
**Stories Reviewed**: 6 (story-a6962b23, story-38de5800, story-a224111f, story-903e3e3a, story-8f33f14c, story-f826e5ca)

## Behavior Inventory

25 behaviors across 6 REQs, verified against the code and 156 passing UATs (143 in the 7 `req4x/39/40` files + 13 in the 3 `reconciliation-*` conformance/safety files).

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Hero/header `tracking` dial + `--tracking-*` tokens (REQ-45) | Covered | story-a224111f | Body documents tracking token group + hook-class emission; `normal` = no override |
| 2 | Hero `subheadLeading` dial (REQ-45) | Covered | story-a224111f | Mapped to `--line-height-*`; `relaxed` preserves prior |
| 3 | text-block/services-grid `contentWidth` left-gutter column (REQ-45) | Covered | story-903e3e3a | `default` fills frame unchanged |
| 4 | contact-form submitForeground / subheadSize / captionSize / caption slot (REQ-45) | Covered | story-903e3e3a | Each dial defaults to prior behaviour |
| 5 | a96677a services-grid card-count UAT robustness | Covered | story-903e3e3a | Folded as test-only, no behaviour change (correctly not itemised) |
| 6 | assertModuleConforms seam + one-module mkdtemp isolation (REQ-39) | Covered | story-a6962b23 | No-pollution model documented |
| 7 | Fast safety checks: overflow/collapse/clip/console+page errors/failed requests (REQ-39) | Covered | story-a6962b23 | Desktop+mobile viewports |
| 8 | `except` exemption + negative-fixture proof-of-discrimination (REQ-39) | Covered | story-a6962b23 | Discrimination is the gated deliverable |
| 9 | BrowserDriver diagnostics/viewport seam + renderSite injectable resolveModule (REQ-39) | Covered | story-a6962b23 | Documented as enabling seams |
| 10 | Security dimension: schema-derived payloads inert + egress allowlist (REQ-40) | Covered | story-a6962b23 | Combined into one seam story per parsimony |
| 11 | Render-path fail-loud on unsafe URL schemes (REQ-46) | Covered | story-38de5800 | assertSafeUrl at every href/src/action sink |
| 12 | Render-path reject dangerous HTML in markdown (REQ-46) | Covered | story-38de5800 | assertSafeHtml before every set:html sink |
| 13 | ContentSafetyError names field+value; safe-rejection counted conformant (REQ-46) | Covered | story-38de5800 / story-a6962b23 | Coupling documented on both sides |
| 14 | Per-element geometry/shape/a11y projection + arrangement + text-free fields[] (REQ-47 A) | Covered | story-8f33f14c | Descends sections→elements |
| 15 | Severity-tier comparator (structural-small > tonal-large) (REQ-47 B) | Covered | story-f826e5ca | Preserves REQ-31/35 orderings |
| 16 | New diff axes: zOrder/treatment/media/transform/motion/viewport/overflow/fontLoad (REQ-48) | Covered | story-8f33f14c (facts) / story-f826e5ca (compare) | Capture-captures / diff-compares split |
| 17 | Multi-state/engine/viewport capture orchestration + freeze/font determinism (REQ-48) | Covered | story-8f33f14c | Honest gap-noting for unavailable engines |
| 18 | OKLab deltaE, systemic aggregation, ignore-masks, anti-self-grading calibration (REQ-48) | Covered | story-f826e5ca | Calibration oracle documented |

## Intent Fidelity — Divergences Noted (not absorbed)

| Divergence | Intent → As-built | Where flagged |
|-----------|-------------------|---------------|
| REQ-46 enforcement location | "reject at the validator" → "reject at render, fail loud" (untyped CTA objects would slip a validator scheme-check) | story-38de5800 Technical Context, explicit |
| REQ-46 inline HTML | original brief assumed markdown drops dangerous HTML → proven false, so rejected not neutralized | story-38de5800 Technical Context, explicit |
| REQ-40 gap-demonstration | gap-demo UATs migrated to REQ-46 RED spec; harness counts ContentSafetyError as safe-rejection | story-a6962b23 REQ-46 coupling note, explicit |

These are model behaviour: the stories capture the operator's as-built direction and *name the refinement of the original brief*, exactly as required.

## Ungrounded Stories

None. Every story claim is supported by intent and code.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Module Conformance Harness (feature) | story-a6962b23 (STORY-65) | ✓ |
| 2. Framework Render-Path Content Safety (feature) | story-38de5800 (STORY-66) | ✓ |
| 3. Chrome Typography Fidelity Dials (upgrade) | story-a224111f (STORY-55) | ✓ |
| 4. Content Column/Contact-Form Dials (upgrade) | story-903e3e3a (STORY-56) | ✓ |
| 5. Richer & Multi-State Capture (upgrade) | story-8f33f14c (STORY-57) | ✓ |
| 6. Values-Diff Severity/New-Axis/Trust (upgrade) | story-f826e5ca (STORY-62) | ✓ |

All 6 plan items produced output. REQ-45 correctly split across STORY-55 (chrome) and STORY-56 (content) with STORY-55 explicitly scoping the content dials OUT to STORY-56 — no overlap, no gap.

## Evidence Sufficiency (Step 5b)

- All UATs enter real interfaces: modules rendered through the real catalog renderer and served over loopback then driven by a headless browser (conformance); capture/extract and values-diff library entry points over synthetic + served manifests; framework safety.ts through renderMarkdown/assertSafeUrl.
- No internal mocking, no source-inspection gate tests. The single `readFileSync` in req47 serves a file over HTTP (a real seam); `extract_script_compiles` is one supporting test among 13 behavioral REQ-47 UATs.
- Discrimination is itself proven: REQ-39/40 negative fixtures (overflow/console-error/collapsed/css-breakout/xss-url/xss-handler/egress) must flag red while clean passes; REQ-48 calibration oracle (`every_seeded_defect_fires`, `calibration_catches_a_blinded_gate`) proves the diff fires on seeded defects. This directly defeats the "broken implementation passes" failure mode.
- 156/156 UATs pass.

## Judgment Calls

- a96677a (services-grid card-count UAT robustness) omitted as its own story — acceptable: test-only, no user-visible behaviour change; correctly folded into STORY-56 per the test-only-story prohibition.
- REQ-39 + REQ-40 combined into one story (STORY-65) — acceptable: two dimensions of one `assertModuleConforms` seam; parsimony over per-dimension inflation.
- REQ-47 + REQ-48 collapsed into item 5 (capture) + item 6 (diff) rather than per-axis stories — acceptable: natural capture-captures-facts / diff-compares-facts boundary; per-axis stories would fragment one coherent capability.

## Verdict

PASS: Stories accurately and completely document the behavior surface of BUNDLE-4 and faithfully represent the operator's stated intent. The two intent→as-built divergences (REQ-46 enforcement-at-render vs at-validator; inline HTML rejected vs neutralized) and the REQ-40→REQ-46 coupling are explicitly flagged in the story bodies rather than silently absorbed. All 6 plan items produced stories, no ungrounded/invented claims exist, and every documented behaviour is backed by passing UATs that enter real interfaces and whose discrimination is proven by negative fixtures. A developer reading these stories would have a correct mental model of what this code does and what the operator intended to build.
