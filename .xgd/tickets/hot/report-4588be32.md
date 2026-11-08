---
uid: report-4588be32
id: REPORT-11534
type: report
title: 'Code Review: bundle-0d00566a'
created_by: xgd
created_at: '2026-11-08T17:46:08.967436+00:00'
updated_at: '2026-11-08T17:46:08.967436+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-0d00566a
  overrides_audited: 2
  trust_boundary_overrides: 0
  anchor_uid: bundle-0d00566a
---

# Code Review

**Result**: FAIL

## Summary
The bundle is integrated, gated and mostly well built. The renderer additions (REQ-211 runs, REQ-212 modals) keep the structured-only boundary, and the REQ-213 role correction gates correctly. One critical security defect fails the review. The new Marked Points enrichment parses a site SVG's markup into the builder's own document, so an uploaded SVG carrying event handlers runs script with the builder's session.

## Quality Gates
Lint: success. Build: success. Preflight: pass. Overall: success (report at 2026-11-08T17:34:07Z). The latest scoped run, report-16feba3a, had 281 tests, 0 failed and 0 skipped. No gate fails.

## External Interface Accessibility
All new entry points are wired in:
- POST /api/material/role is routed (router.ts) and called from api.js:624. library.js:355/570 uses it through `setRole`.
- `createMarkedPoints` is called from app.js:429. main.js:7/78 serves `/framework/marked-points.js` and `measureScript` to it.
- `L1_DIALOG_SCRIPT` and `L1_DIALOG_CSS` are exported from packages/framework/src/index.ts:114-115. The renderer emits the script only when `hasDialog` is set.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/builder/points.js:114-116, 426 | `evaluateMeasure` runs `measureScript(svg)` with `new Function` in the builder document. `measureScript` does `shadow.innerHTML = SVG` (tools/generate/src/cli/capture/measure-svg.ts:156) on SVG text fetched from any preview `<img>` whose src ends `.svg`. Markup parsed into a connected shadow root runs its event-handler attributes. | Critical |
| apps/control-app/src/material.ts:611 / tools/generate/src/cli/edit.ts:2225-2253 | Client-uploaded SVGs reach the site through `promoteToSiteAsset` → `editAssetAdd` without `validateSvg`. That was safe while SVGs were only ever painted by `<img>`, which runs no script. points.js now makes those bytes run as live markup in the control-app origin. | (cause of the above) |
| tests/reconciliation-marked-points.test.ts:208, tests/test_UAT_FC_REQ-210_marked_points.test.ts:166 | Both suites inject `measure`, so the real `evaluateMeasure` path never runs. No test passes a hostile SVG through enrichment. | Warning |
| apps/control-app/src/router.ts (`/api/material/role`), material.ts `reviseRole` | Origin gate, `republishable` worked out on the server, 403/409 split, and soft placement through the shared `placeOnSite`. Clean. | OK |
| packages/framework/src/l1/render.ts (REQ-211/212) | Run CSS comes from `cssColor` and from enum or bounded numeric axes. Attribute values go through `escapeHtml`. The dialog script is a constant with no instance data, the same pattern as the reveal and pointer scripts. `type="button"` is set, and an action is dropped in the edit render. | OK |
| packages/site-schema/src/l1/validate.ts | Run envelope bounds and the dialog/action structural rules reuse `seenIds`. Clean. | OK |

No debug leftovers, TODOs or commented-out blocks were found in the production diff.

## Checklist Compliance
No architecture, security or design checklist report exists. Section skipped.

## Smoke Test
Entry points: POST /api/material/role. Not invoked in this review. Evidence comes from the workers UATs (test_UAT_FC_REQ-213_material_role.workers.test.ts, reconciliation-library-role-correction.workers.test.ts), which pass in the green quality run.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.
- report-22b124dd (code_frozen, rung 3): one builder.css declaration, the 13px literal replaced by `var(--builder-control-font-size)`. Named file only, consistent with AC-2232, inside the stated scope, `trust_boundary_touched` false, tests green. All items pass.
- report-974846f1 (code_frozen, rung 2): builder.css gains a `.builder-library__badge--role` rule restating the muted resting badge, and the test double's `subscribe` shape changes (test file, outside the rule). `unnamed_files_touched` is empty, conformance pass, no `.is-placed` state and no font-size literal, trust boundary false. All items pass.
Neither override is misjudged.

## Issues Found
**Critical (must fix)**:
- Stored XSS in the builder origin through Marked Points SVG measurement (points.js:114-116, :426 → measure-svg.ts:156). Path: a client uploads a `.svg` to the site, containing for example `<svg ...><image href="x" onerror="fetch('/api/...')"/></svg>`. promoteToSiteAsset stores it unvalidated. Any builder user (owner, staff or GenDev admin, per DOC-5 rule 25) marks a point on it in the edit preview. drawingFor fetches it, and shadow.innerHTML parses it into the builder document. The handler runs with that user's session. The control app sets no CSP to block it.

**Warnings (should fix)**:
- No test covers the real `evaluateMeasure` path, because both suites inject `measure`.

## Fix-It Prompt
Fix the stored-XSS sink in Marked Points SVG enrichment without changing what an honest drawing reports.
1. In apps/control-app/src/builder/points.js `drawingFor` (around line 421-431), run the fetched SVG through the same closed-grammar validator the generated-asset path uses (`validateSvg` from packages/site-schema/src/svg.ts) before calling `measure`/`evaluateMeasure`. If the validator refuses the drawing, skip the measurement: set `measurement` to null, so the `near:` line is omitted, the same as the existing catch branch. Never parse an unvalidated drawing into the builder document. If `validateSvg` is not yet served to the browser, add it to the framework import graph that main.js already uses (`/framework/...`) and pass it through `api`, the same way `measureScript` is passed. Do not hand-roll a second validator.
   Alternative, if validation alone cannot be made sufficient: run the measurement inside a sandboxed iframe (`sandbox="allow-scripts"`, no `allow-same-origin`) so the parse happens in an opaque origin. Validation is the preferred fix.
2. Add a UAT under the existing REQ-210/BUG-72 naming that drives `createMarkedPoints` without injecting `measure`, so the real `evaluateMeasure` path runs, using an SVG asset that carries an event handler (for example `<image href="x" onerror="window.__pwned=1"/>`). Assert that no handler runs (`__pwned` stays undefined), that no shadow host is left in the builder document, and that the point still carries its exact drawing coordinates with `near` omitted. Keep a benign SVG case showing `near` is still produced.
3. Do not change upload ingestion, promoteToSiteAsset, or the L1 renderer as part of this fix.
