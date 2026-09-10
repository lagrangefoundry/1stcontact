---
uid: report-b90a2271
id: REPORT-3700
type: report
title: 'Fix Draft Change Journal: What Changed On The Draft, And Who Changed It (ac)
  — attempt 1'
created_by: xgd
created_at: '2026-09-10T08:30:24.113905+00:00'
updated_at: '2026-09-10T08:30:24.113905+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-702b7c02
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Draft Change Journal: What Changed On The Draft, And Who Changed It (ac)

**Attempt**: 1
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

## What the findings actually were

Findings 1 (violation) and 2 (warning) are the same omission seen twice, exactly as the
assessor's "Notes for the Editor" says: STORY-115's AC tree covers the journal's
*mechanism* exhaustively (16 ACs, all 16 with UATs) and its *guidance* not at all. Both
were resolved with **one** new AC plus its UAT, in this call. Findings 3–6 are `info`
with resolution category `—` and required no action.

The assessor's instruction *"Do not resolve this as `code-issue`"* was honoured: no
production code was touched. The three surface elements were verified to be present and
to match the story body word for word before the AC was authored:

- `tools/generate/src/cli/ai/l1-surface.json` `overview` — the paragraph beginning
  *"**Your user can change the site themselves, while you are working on it.**"*, which
  carries told-at-the-start-of-a-turn, look-before-you-act, and never-write-over-an-
  unread-change.
- the same file's `sequences` — *"Pick up after your user has been editing"*, steps
  `list_changes → describe_page → get_l1`, note *"start here — not with a re-read of the
  page … never write over a change you have not read"*.
- the same file's `absences` — *"Undoing a change"*, now citing `list_changes` as where a
  prior value is found while still declaring there is no undo.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-add | **AC-1621** (`acceptance_criterion-aa0adbc3`), under STORY-115 (`story-6cd17452`) | Authored *"The manual carries the cross-cutting rule for a site that moved, a sequence that starts from the change log, and an undo absence that cites it"*. Three-part criterion — (1) the overview's cross-cutting rule, reaching the manual *through the projection of the declaration*, per finding 1; (2) a named sequence whose **first** step is the change read rather than a page re-read, per finding 1; (3) the undo absence citing the change log as the record of prior values while still declaring no undo, per finding 2 folded in as the assessor suggested. `story_uid`, `kind: behavior` — matching the field shape of AC-1253…AC-1268 exactly. |
| 2 | uat-add | AC-1621 | Authored `test_UAT_AC1621_the_manual_carries_the_rule_the_sequence_and_the_undo_note` in `tests/reconciliation-draft-change-journal.test.ts`, inside the existing `story-6cd17452 — the change-reading operation is declared, granted and marked` describe block, immediately after AC-1265's case. Paired with the `ac-add` in the same call per Step 4, so the new AC is not an immediate coverage gap. |

### Why the UAT is not vacuous

It is a manual-projection assertion of the same shape as AC-1264's, and it takes the same
anti-vacuity precaution CAP-92's AC-1080 takes with the addressing paragraph: the
overview paragraph is **selected out of `L1_DECLARATION` by its wording**, asserted to be
exactly one paragraph, asserted to state each of the three obligations, and only then
required to appear in `box.manual()` verbatim — so the rule cannot be satisfied by a
preamble written beside the manual while the declaration's own overview says something
else. The sequence is likewise selected by `steps.includes('list_changes')` and asserted
to be exactly one, then checked for first-step-is-the-change-read, for every step being a
declared *and granted* operation (`ReadSite` holds all three), and for name and note both
reaching the manual. The undo absence is checked to cite `list_changes`, to still say
there is no undo, and — the load-bearing negative — that no declared operation matches
`/undo|revert|rollback/`, so the note cannot have been softened by quietly adding one.

It uses the real `createL1Toolbox` against a real site on disk. Nothing is stubbed.

Result: **passes**.

```
✓ test_UAT_AC1621_the_manual_carries_the_rule_the_sequence_and_the_undo_note
  Test Files  1 passed (1)   Tests  1 passed | 16 skipped (17)
```

## Code Edits (if any)

None this call. Test-only and ticket-only, as the assessor directed.

## Pre-existing failure observed (NOT introduced here)

Running the whole file surfaces one unrelated failure:

```
× test_UAT_AC1266_the_reminder_carries_the_change_signal_only_when_somebody_else_moved_the_site
  TypeError: Cannot add property reminder, object is not extensible
    at streamPrompt tools/generate/src/cli/ai/host-core.ts:596
```

`host-core.ts:596` assigns `role.reminder = …` onto a role object that is now frozen. I
confirmed this is pre-existing rather than collateral from my edit by restoring the file
from `HEAD` into a scratch test path and running the same case against it — it fails
identically at `HEAD`, before any change of mine. My edit adds one `it()` in a different
describe block, touches no production code and no shared state.

This is a **candidate `code-issue` for a later cycle**, but it is out of scope for this
one: it is a runtime regression in the reminder write path, not an AC-tree defect, and it
belongs to whichever intent froze the role object. Flagging it rather than fixing it,
because fixing it here would be an unevidenced production edit in a level=`ac` fix pass.

## Fields not touched, deliberately

`uat_coverage` was **not** set on AC-1621. None of AC-1253…AC-1268 carries that field,
and it is owned by the `check_uat_coverage` / `fix_uat_coverage` pair — setting it here
would both break the field shape this story's ACs share and pre-empt an owner that will
run its own verification. The UAT exists and passes; the coverage phase can record that.

## needs_review Items Forwarded

None. As the assessor recorded, Step 2.5 was not triggered — no story or AC text under
this capability names a ticket as a delivery vehicle, and no intent in the ledger is
abandoned, deprecated or wont_fix.

## Note for the next cycle

The assessor's *"Ledger provenance is thin"* observation still stands and I did not
change it: neither CAP-99 nor STORY-115 carries an `updated_by` field, and the ACs —
including the new AC-1621 — carry no `intent_uid`. AC-1621's intent lineage is REQ-131
Part 2 bullets 4–5 and 7 (in BUNDLE-19, `bundle-77b28def`), recorded here in prose since
the AC schema in use for this story carries no field for it. A future cycle re-deriving
the ledger will have to repeat the store-wide scan.
