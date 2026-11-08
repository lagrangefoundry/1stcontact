---
uid: report-33f683b4
id: REPORT-11487
type: report
title: 'Report: blocked_by_handoff for STORY-99'
created_by: xgd
created_at: '2026-11-08T15:01:57.285981+00:00'
updated_at: '2026-11-08T15:08:05.130226+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: STORY-99
  rule: code_frozen
  evidence: 'Ran `npx vitest run` on tests/reconciliation-builder-workspace-typography.test.ts
    after the authorised edit. test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry
    now fails at line 440: `no builder rule matches: builder-library__badge--role`.
    apps/control-app/src/builder/library.js:472 emits that class, and builder.css
    has rules for .builder-library__badge (1130) and .builder-library__badge--unplaced
    (1154) but none for --role. AC-2232 Verification: ''Assert that every builder-*
    class they emit is matched by a rule in the builder stylesheet.'' The exception
    covers only the composer''s 13px declaration (''Change nothing else in the stylesheet''),
    and library.js is frozen. Of the six node test files run, 31/33 tests pass; the
    other failure is AC965''s sandbox network timeout, which is out of scope. The
    two .workers.test.ts files were not run. Assertions after line 440 (the static
    sweep) have not run, so --role may not be the last violation.'
  proposed_change: 'Widen the builder.css exception to add a rule for the role badge,
    e.g. `.builder-library__badge--role { font-size: var(--builder-control-font-size);
    }` next to .builder-library__badge--unplaced (around builder.css:1154). Or, if
    the modifier is meant to be unstyled, lift code_frozen on apps/control-app/src/builder/library.js:472
    to drop the `builder-library__badge--role` class. Then rerun the typography file
    so the static sweep after line 440 runs too.'
  batch_index: 0
  parent_report_uid: report-0f13d2a4
  anchor_ticket: bundle-0d00566a
  ruling: granted
  ruling_reason: the planner granted an override in its plan
---

# Builder blocked by `code_frozen`

**Evidence**: Ran `npx vitest run` on tests/reconciliation-builder-workspace-typography.test.ts after the authorised edit. test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry now fails at line 440: `no builder rule matches: builder-library__badge--role`. apps/control-app/src/builder/library.js:472 emits that class, and builder.css has rules for .builder-library__badge (1130) and .builder-library__badge--unplaced (1154) but none for --role. AC-2232 Verification: 'Assert that every builder-* class they emit is matched by a rule in the builder stylesheet.' The exception covers only the composer's 13px declaration ('Change nothing else in the stylesheet'), and library.js is frozen. Of the six node test files run, 31/33 tests pass; the other failure is AC965's sandbox network timeout, which is out of scope. The two .workers.test.ts files were not run. Assertions after line 440 (the static sweep) have not run, so --role may not be the last violation.

**Proposed change**: Widen the builder.css exception to add a rule for the role badge, e.g. `.builder-library__badge--role { font-size: var(--builder-control-font-size); }` next to .builder-library__badge--unplaced (around builder.css:1154). Or, if the modifier is meant to be unstyled, lift code_frozen on apps/control-app/src/builder/library.js:472 to drop the `builder-library__badge--role` class. Then rerun the typography file so the static sweep after line 440 runs too.

## Ruling: granted

the planner granted an override in its plan
