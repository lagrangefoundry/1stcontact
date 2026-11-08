---
uid: report-dfb61819
id: REPORT-11485
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T15:01:39.352139+00:00'
updated_at: '2026-11-08T15:01:39.352139+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: STORY-99
  parent_report_uid: report-0f13d2a4
  batch_index: '0'
---

AC-2232's mounted-ancestry test still fails, so this batch isn't finished. I made the authorised change, but it uncovered a second violation that the exception doesn't cover. Everything else in the batch passes.

**What I changed:** one line in `apps/control-app/src/builder/builder.css`. In the composer rule (`.builder-people__subject`, `__tolist`, `__body`), `font-size: 13px;` is now `font-size: var(--builder-control-font-size);`. It stays right after `font: inherit;`, as the AC requires.

**Results:**
- That fixed the "sized, but not by the control token" assertion. The Invite composer's inputs no longer appear in it.
- The test now fails at the next assertion: `no builder rule matches: builder-library__badge--role`. The earlier failure was hiding it.
  - `library.js:472` puts the class `builder-library__badge--role` on the Library's role badge, and the stylesheet has no rule for it. Its sibling `--unplaced` does have one, at `builder.css:1154`.
  - AC-2232's Verification says every `builder-*` class the mounted surfaces emit must be matched by a builder rule. So the test is right, and the code breaks that rule.
- All other tests in the six files I ran pass: 31 of 33. That includes the nine stale-test fixes from iteration 1. The other failure is AC965, the wrangler timeout the planner said to ignore. I did not run the two `.workers.test.ts` files.
- I couldn't confirm that `badge--role` is the last remaining violation. The test stops at the first failing assertion, so the static sweep after it never ran. My attempt to add a rule temporarily, run the test and revert was refused by the session's permissions. The stylesheet now contains only the one-line change.

**Why I stopped:** the exception names `builder.css`, but its justification and the planner's instructions cover only the one composer declaration ("Change nothing else in the stylesheet"). The class name lives in `library.js`, which stays frozen. Changing the test to exempt it would weaken an assertion the AC spells out.

```yaml
## Assessment
status: partial
fixed:
  - "builder.css composer rule: font-size 13px -> var(--builder-control-font-size) (authorised exception). Clears AC-2232's offToken assertion."
blocked_by:
  rule: code_frozen
  evidence: "Ran `npx vitest run` on tests/reconciliation-builder-workspace-typography.test.ts after the authorised edit. test_UAT_AC2232_every_text_bearing_builder_control_resolves_to_the_control_token_through_its_mounted_ancestry now fails at line 440: `no builder rule matches: builder-library__badge--role`. apps/control-app/src/builder/library.js:472 emits that class, and builder.css has rules for .builder-library__badge (1130) and .builder-library__badge--unplaced (1154) but none for --role. AC-2232 Verification: 'Assert that every builder-* class they emit is matched by a rule in the builder stylesheet.' The exception covers only the composer's 13px declaration ('Change nothing else in the stylesheet'), and library.js is frozen. Of the six node test files run, 31/33 tests pass; the other failure is AC965's sandbox network timeout, which is out of scope. The two .workers.test.ts files were not run. Assertions after line 440 (the static sweep) have not run, so --role may not be the last violation."
  proposed_change: "Widen the builder.css exception to add a rule for the role badge, e.g. `.builder-library__badge--role { font-size: var(--builder-control-font-size); }` next to .builder-library__badge--unplaced (around builder.css:1154). Or, if the modifier is meant to be unstyled, lift code_frozen on apps/control-app/src/builder/library.js:472 to drop the `builder-library__badge--role` class. Then rerun the typography file so the static sweep after line 440 runs too."
```