---
uid: report-4d56e91c
id: REPORT-2172
type: report
title: 'Sync-main review: reconcile-BUNDLE-18'
created_by: xgd
created_at: '2026-08-17T02:52:02.493614+00:00'
updated_at: '2026-08-17T02:52:02.493614+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: sync_main_review
  subject_uid: reconcile-BUNDLE-18
---

{
  "findings": [
    {
      "risk": "LOW",
      "file": "tests/reconciliation-colour-census-and-retrofit.test.ts",
      "description": "Stale references to the removed `L1PaletteEntry.steps` field at lines 374, 440 and 448. REQ-137 deleted `steps` from `l1PaletteEntrySchema` (the entry is now `{ value }` only, `.strict()`), so `entry.steps` is always undefined: line 374's step count is permanently 0, and the `?? {}` guards at 440/448 iterate nothing. Verified harmless at runtime — the file passes (9/9 tests) because the `steps === 0` branch matches the emitted output format. This is type-stale dead code, not a behavioural regression, and not a revert of main's intent. Worth a cleanup pass so the assertions stop being vacuous. Note vitest strips types without checking them and no root tsconfig typechecks tests/, so nothing currently flags it."
    },
    {
      "risk": "LOW",
      "file": "tools/generate/src/cli/colors.ts",
      "description": "Deliberate relaxation of a previously absolute invariant, flagged for visibility rather than as a defect. main guaranteed byte-identical round-trip on palette assignment (\"pixel-identical or it is a bug\", DOC-23 SS7); the REQ-137 rewrite introduces SHADE_FIT_TOLERANCE = 8 (per-channel bytes) for fitted shades. Confirmed properly bounded, not a silent loosening: a reference naming an entry's own colour is still held to limit 0 (colors.ts:668), a colour a mix cannot reach becomes its own byte-exact entry rather than being approximated (colors.ts:454-455), the write aborts via CommandError if anything exceeds the bound (colors.ts:672), and accepted drift is reported through AssignResult.drift and formatAssign. This is branch-forward REQ-137 design applied on top of main, not a rebase artifact."
    },
    {
      "risk": "LOW",
      "file": "tests/test_UAT_FC_REQ-130_beyond_l1.test.ts",
      "description": "Pre-existing failures, NOT branch-induced — recorded so the reconcile operator is not surprised by a red suite. The full suite on this branch fails 74 tests across 12 files (assistant/chat/L1-surface area: reconciliation-assistant-control-surface, reconciliation-assistant-conversation, reconciliation-beyond-l1-authoring, reconciliation-builder-assistant-pane, reconciliation-page-composition-surface, REQ-122 chat_host/chat_panel/tool_surface, REQ-126_l1_surface, REQ-127_session_binding, REQ-129_l1_authoring, REQ-130_beyond_l1). Running the identical file set against the main worktree at the merge-base (5046dd0db) produces exactly the same result — 12 failed files / 74 failed tests — and a diff of the two failing-file sets is empty. The branch neither introduces nor repairs these."
    },
    {
      "risk": "OK",
      "file": "packages/site-schema/src/l1/palette.ts",
      "description": "Checked for the failure modes this review targets; none found. (1) No unresolved conflict markers anywhere in the tree (briefing also reports zero conflict files). (2) No deletion revert: the five files the briefing marks `(deleted)` all exist in HEAD, but git history shows zero delete events for any of them repo-wide and none exist in main or the merge-base — they are pure branch additions, so the `(deleted)` label is a diff-direction artifact, not main's intent being resurrected. (3) The steps-to-shade migration is complete and coherent rather than partial: `steps` is gone from the entry schema, `shade` is bounded to [-1,+1] at parse time, `shadeHex` is implemented and exported via index.ts, `resolveL1Color` handles it, the now-redundant step check in validate.ts is correctly removed (a shade cannot dangle), and no `\"step\"` survives in storage/ site JSON. (4) The security envelope is intact — `.strict()` counts are identical to main (palette.ts 4/4, schema.ts 51/51) and both `shade` and `alpha` are range-bounded, so DOC-2's structured-only invariant is preserved. (5) .claude/settings.json and builder.css are purely additive; page-style.js makes `--preview-color` conditional for BUG-34 with the `var(--preview-color, var(--shell-fg))` fallback still in builder.css and tests covering both branches. Targeted suites for the touched area pass: 56/56 across req121, req114, glyph-paint, BUG-34, REQ-137 and palette-overlay, plus 9/9 for census-and-retrofit."
    }
  ]
}
