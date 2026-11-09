---
uid: report-da2e2310
id: REPORT-12019
type: report
title: 'Code Review: bundle-0881342c'
created_by: xgd
created_at: '2026-11-09T20:39:03.691153+00:00'
updated_at: '2026-11-09T20:39:03.691153+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-0881342c
  overrides_audited: 2
  trust_boundary_overrides: 0
  anchor_uid: bundle-0881342c
---

# Code Review

**Result**: PASS

## Summary
BUNDLE-43 (REQ-219/220/221/222, BUG-78) adds the publish-time width ladder and srcset/sizes emission, HEIC conversion at upload, the image recipe renderer, the image modal with an editable Library name, and the draft-preview lead fix. Quality gates are green, every new module is wired, and the renderer's new srcset/sizes output is escaped through a single sink. 2 overrides audited, 0 touched a trust boundary; both pass the checklist.

## Quality Gates
Lint: success. Build: success. Preflight: pass. Overall: success (quality report 2026-11-09T20:27:50Z). Not re-run in this review.

## External Interface Accessibility
New entry points wired in: yes.
- `image-ladder.ts` → `router.ts:22` (`ladderFor`); `publish/ladder.ts` → `publish.ts:2`, `router.ts:21`
- `heic.ts` → `material.ts:64`, `router.ts:122`
- `image-edit.ts` → `router.ts:56`; `cli/image-recipe.ts` → `material.ts:54`, `router.ts:60`, `image-edit.ts:36`
- `cli/ai/image-core.ts` → `host-core.ts:73`; `image-surface.json` → `image-core.ts:29`
- `l1/delivery.ts` → `render.ts:44`, re-exported from `framework/src/worker.ts:118-119`
- Builder: `image-editor.js` and `picture-kind.js` are imported by `app.js:24-25` and `library.js:97-98`; `material-name.js` by `library.js:99` and `image-editor.js:64`; `image-preview.js` by `image-editor.js:63`

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| apps/control-app/src/builder/library.js:741-777 | The JSDoc for `reload` (741-764) now sits directly above the new `renamed` JSDoc (765-773), so `reload`'s docblock no longer attaches to `reload` | Warning |
| apps/control-app/src/builder/library.js:633-636 | Comment "A DIALOG THAT CLOSES ITSELF STILL HAS TO SAY SO" refers to the removed `editor.close` wrapper and now describes nothing; move it onto the `onClose` property at 629 | Warning |
| apps/control-app/src/builder/library.js:774-777 | `renamed` skips only when the pane's name cell is in edit mode, then calls `adoptSaved` → `editor?.setName` → `fields.setValues`, which replaces a modal name box the client is typing in. AC-2556 names only the open detail's field, so this is not a failure | Warning |
| packages/framework/src/l1/render.ts:1702-1712, 2858-2876 | srcset is the single sink: allowlisted URL characters, `escapeHtml`; `sizes` only beside srcset and escaped. Good | — |

## Checklist Compliance
No architecture, security, or design checklist reports exist (all three queries returned empty); section skipped.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.

**report-0712dc13 (code_frozen, story-1500b111, rung 1)**: PASS.
1. `unnamed_files_touched` is empty; production edits are confined to api.js, app.js, image-editor.js, library.js, material-name.js (all named). modal.js is named and untouched; the test files fall outside the code_frozen scope.
2. The quality report passes (relied on, not re-run).
3. Consistent with AC-2556: scoped file-route parsing; every modal exit reports through `createModalShell`'s one guarded `close` (modal.js:70-88, Escape :82, backdrop :88) to a new `onClose` that clears `editor`/`chatPicture`; change-feed renames reach the field, alt and an open modal via `adoptSaved`, with the pane typing guard; `required: true` is removed so `onCommit` throws NAME_REQUIRED (material-name.js:78).
4. Each of the planner's items (a)–(d) maps to one hunk, and the two AC-1718 test expectations are updated to include `title`. Nothing else changes.
5. `trust_boundary_touched` is false (notes come from the test file only). The new hostile-title UAT also asserts inert text.
6. No edit to an unnamed file and no behaviour beyond REQ-220/AC-2556.

**report-f9c72a40 (code_frozen, story-6ccaedd5, rung 2)**: PASS.
1. Only `apps/control-app/wrangler.toml` was touched (named).
2. Quality report passes.
3/4. The duplicate `[images]` and `[env.production.images]` are removed and the REQ-222 rationale is folded into the single block, with [[REQ-221]] and [[REQ-222]] added to the production citation. No binding name is changed. Tables are now single: `[images]` :376, `[env.production.images]` :468.
5. Not a trust boundary.
6. Matches `tip_evidence`; config-only.

## Smoke Test
Entry points: new Worker routes (material name/recipe, HEIC upload, publish ladder) and the builder modal. They are exercised end to end by the workers-pool UATs (e.g. test_UAT_FC_REQ-222_publish_ladder.workers, test_UAT_FC_REQ-221_heic_upload_route.workers, test_UAT_FC_REQ-220_material_name_and_recipe.workers), which pass in the quality report. No separate live smoke test was possible in this sandbox.

## Issues Found
**Critical (must fix)**:
- None

**Warnings (should fix)**:
- library.js:741-777 — `reload`'s JSDoc is orphaned above `renamed`'s; put each docblock directly above its own function.
- library.js:633-636 — stale comment about the removed close wrapper; attach it to the `onClose` option.
- library.js:774-777 — a feed rename overwrites an in-progress edit in the open modal's name box; consider also skipping `editor.setName` when the modal's name cell has `.fields-control-cell`.
