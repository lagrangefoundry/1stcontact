---
uid: report-9ac75528
id: REPORT-8046
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-02T00:41:53.240086+00:00'
updated_at: '2026-11-02T00:41:53.240086+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

Cherry-pick of 3d836b66c5 ("Merge branch 'free-BUG-53' into xgd-working", authored 2026-09-05T14:07-07:00). Both sides free_coded, so the later working-timeline position wins. The HEAD-side commits touching these files are later: a2000833cb "fix(builder): declare the control size after the shorthand that resets it" (15:15), cb183be69c "rename the Users tab and its People list to Contacts" (15:30), aacdc97d5a "feat(people): a contact sits on two axes" (16:34).

- apps/control-app/src/builder/builder.css: UU code file (2c). Kept HEAD. Incoming adds a grouped `font-size` rule near the top; a2000833cb states that this rule loses to the later `font: inherit` shorthands and replaces it with a per-rule `font-size` after each shorthand. HEAD's comments also reflect the People to Contacts rename and the `__states` to `__facet` split (REQ-188).
- package.json: UU scalar (version). Kept HEAD 0.2.81 over incoming 0.2.78 (older).
- tests/test_UAT_FC_BUG-53_control_type_is_consistent.test.ts: AA UAT test (2b/2f). HEAD is a strict superset. All 7 incoming `it()` functions are present, plus HEAD's added `no_controls_size_is_left_to_a_later_font_shorthand`. HEAD's `winningFontDecl` (resolution check) replaces incoming's `sizingRule` (existence check), which a2000833cb identifies as the check that let the defect ship. CONTROLS uses `.builder-people__facet` per REQ-188.

## Incoming changes preserved

Redundant commit (BUG-1109/BUG-1122 shape): the staged diff vs HEAD is empty. The incoming non-conflicting changes (business.js, people.js, the `--builder-control-font-size` token, the `builder-modal__btn` class fix, every test function) are already present in HEAD. Only incoming's first-pass mechanisms (grouped rule, existence assertion, `__states` selector) are absent, and later free_coded commit a2000833cb explicitly supersedes them. No developer code was discarded. Finalize should see a clean staged diff and skip.

Flag for post-merge review per the enrichment rule: builder.css, package.json, test file. Low risk, since the resolution equals HEAD.

## Arbitration of last resort (BUG-1460)

Tier 1 (most recent intent): a2000833cb's message calls the incoming approach "the first pass at BUG-53 shipped a rule that reached nothing" and replaces it. Dropped side: incoming conflict hunks only.
