---
uid: report-4298fc9e
id: REPORT-2057
type: report
title: 'Fix Site Control Surface: Declared, Granted, Validated & Audited (uat) — attempt
  1'
created_by: xgd
created_at: '2026-08-16T03:26:47.654523+00:00'
updated_at: '2026-08-16T03:26:47.654523+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-00e77e55
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-7ef6a9ea
---

# Fix Summary — Site Control Surface: Declared, Granted, Validated & Audited (uat)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0 (both findings' mutations applied; see the verification caveat below)
**Needs more work**: false

All three findings in report-cd1bf91b are test-layer work in one file,
`tests/reconciliation-assistant-control-surface.test.ts`, and all three were
applied in this call. No ticket bodies were edited (the ac level closed clean and
neither finding implicates an AC's text), and no production code was touched —
consistent with the assessor's note that neither violation is a `code-issue`.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1142 (`acceptance_criterion-670113cb`) | Authored `test_UAT_AC1142_worked_sequences_are_declared_data_and_none_names_an_ungranted_operation` (`tests/reconciliation-assistant-control-surface.test.ts:528-590`), plus a `Sequence` interface and a `sequences()` reader alongside the existing `operations()` / `groups()` helpers. |
| 2 | uat-edit | AC-1080 (`acceptance_criterion-73371752`) | Added the missing addressing-rule clause to `test_UAT_AC1080_...` (`:440-452`). |
| 3 | uat-edit (warning) | AC-1074 (`acceptance_criterion-c595b0f5`) | Replaced the two hard-coded `not.toContain('### <title>')` literals with withheld groups derived from `L1_DECLARATION.groups` ∖ the grant in `instances.json` (`:260-276`), plus a `grantedGroups()` helper. |

### 1 — AC-1142, the new UAT

Reads `L1_DECLARATION.sequences` **directly**, not through `validateData` (an
empty list satisfies the format check unchanged), and asserts, in the AC's own
order:

- the list is non-empty; each entry names itself, orders ≥2 steps, and carries a
  non-empty note;
- every step is the `tool` of a declared operation (set membership against
  `operations()`);
- every sequence that both reads and replaces an element orders `get_l1` before
  `set_l1`, and `describe_page` before `get_l1` — the address is read from the
  map before the element is read, and the element before it is replaced. Both
  page-editing sequences are caught structurally by this filter rather than by
  name;
- the changing sequence's note explains the whole-element replacement (`/whole/i`);
- the add-or-take-away sequence has that same read-then-write shape, names no
  insert/delete step, and the declaration declares no insert/delete operation
  for it to name (so the "because none is declared" half is evidenced, not
  assumed);
- **the grant-filtering clause**: build the caretaker Toolbox, compute the
  sequences naming an operation outside `box.toolNames()`, assert that set
  contains `Publish deliberately` (so the check is not vacuous today), assert
  neither its name nor its note appears in `box.manual()`, and assert that every
  sequence that *does* appear in the manual names only offered operations.

`test_UAT_AC1088` in `tests/reconciliation-page-composition-surface.test.ts:472`
was left alone: it belongs to another capability's AC and corroborates one clause
from a composition flow. The new test does not duplicate any AC in this tree —
it is the only `test_UAT_AC1142_*` in the repo.

### 2 — AC-1080, the addressing rule

The test now takes the addressing paragraph out of `L1_DECLARATION.overview`
structurally — split on blank lines, keep the paragraph matching `/re-read/i`,
assert exactly one such paragraph exists and that it also carries
`/regenerat/i` — and requires `box.manual()` to contain that paragraph verbatim,
plus the two wordings independently. Tying the assertion to the declaration's own
text (rather than to a literal repeated in the test) is what makes it fail if the
rule is ever re-authored beside the manual instead of projected from the
declaration, which is precisely AC-1080's claim and the thing AC-1081 (which
asserts the rule in the *declaration*) cannot cover.

### 3 — AC-1074, the warning

`withheld = groups() ∖ grant`, then for each withheld group assert the manual
contains neither `### <title>` nor `**<tool>**` for any of its operations. The
heading and bullet forms are preserved from the original assertions (the manual's
rendering shapes), and an `arrayContaining(['ManageAssets', 'Publish'])` anchor
keeps the derivation honest — that anchor fails loudly if the grant widens,
rather than going silently vacuous the way the old title literals would on an
upstream re-wording. The three `**add_asset**` / `**remove_asset**` /
`**publish**` operation-level assertions are now produced by the loop.

## Code Edits

None. No production file was modified; the diff is 104 insertions / 6 deletions
in one test file.

## Verification — not executed, and why

**The tests were not run in this session.** Every attempt to execute them was
refused by the session's permission mode (`npx vitest run …`,
`./node_modules/.bin/tsc --noEmit`, and any command reaching outside the
worktree). This is the same environment limitation the assessor recorded in
report-cd1bf91b, and it is reported rather than worked around: no `uat_coverage`
field was set to `pass` on AC-1142, AC-1080 or AC-1074, because nothing in this
session observed them passing.

What *was* verified statically, by reading the artifacts on disk:

- `l1-surface.json` declares six sequences; every step of every one is a declared
  operation's `tool` (`op === tool` throughout); `Change something on a page` and
  `Add something to a page, or take something away` are both
  `[describe_page, get_l1, set_l1]`; `Publish deliberately` is
  `[status, publish]`.
- `instances.json` grants the caretaker `ReadSite, AuthorPages, ManagePages,
  ManageComponents, WriteConfig, DrawImages`, so the withheld groups are exactly
  `ManageAssets` and `Publish` — matching the titles the old AC-1074 literals
  named, so mutation 3 preserves current behaviour while deriving it.
- `L1_DECLARATION.overview` contains exactly one paragraph matching `/re-read/i`,
  and it also matches `/regenerat/i` — so AC-1080's new paragraph selection
  resolves to one paragraph rather than throwing or matching nothing.

**Expected-failure notice, carried forward from the assessor.** Two assertions
depend on the manual generator, which lives in the upstream `@lagrangefoundry/ai`
store and is not resolvable under this worktree's `node_modules`:

- AC-1142's grant-filtering clause — if the manual projects sequences unfiltered,
  it will surface `Publish deliberately` and the test will fail. That failure is
  the finding the assessor predicted, and the repair for it lands upstream in the
  manual projection, not in this repository.
- AC-1080's `manual` ⊇ overview addressing paragraph — passes if the manual
  projects the overview verbatim (the expected shape); fails if it reflows or
  omits it, which again is an upstream projection question.

Whoever runs the suite next should read a failure of either as a real finding
about the manual, not as a defect in these tests.

## needs_review Items Forwarded

None. Neither violation was categorised `needs_review`, and neither required a
judgement the report did not already settle.
