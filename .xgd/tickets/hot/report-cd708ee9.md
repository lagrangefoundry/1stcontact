---
uid: report-cd708ee9
id: REPORT-3782
type: report
title: 'Fix UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path
  — attempt 4'
created_by: xgd
created_at: '2026-09-10T19:24:02.656375+00:00'
updated_at: '2026-09-10T19:24:02.656375+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-f753cecd
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path

**Attempt**: 4
**Fixes applied**: 2 (1 violation, 1 warning)
**Violations remaining**: 0
**Needs more work**: false

Both findings of report-d7beaba8 were resolved as the assessor categorized them
(`uat-edit` in both cases). No AC body was rewritten, no AC deprecated, no story
body edited, no production code changed. Landed as `b0efd5fdba`.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-1120 (`acceptance_criterion-3235871e`) / `tests/reconciliation-copy-edit-typography.test.ts:560` | Added the missing status-quo re-post to `test_UAT_AC1120_italic_is_read_only_only_on_positive_evidence_of_absence`, exactly as the report prescribed. `uat_coverage` → `pass` |
| 2 | uat-edit | AC-988 (`acceptance_criterion-97f5dee6`) / three AC-988 tests | Recorded the delegation as a header comment in each, per the report's stated preference ("Prefer the comment — do not widen these tests' absence-assertions"). No assertion added, removed or relaxed |
| 3 | — | STORY-100 (`story-37a3921b`) | `uat_coverage` → `pass` (AC-1120 was the story's only outstanding gap) |

### Finding 1 — what was added and why it is load-bearing

After the existing refusal of a *changed* italic on `A_HEADLINE`:

```ts
const saved = await set(A_HEADLINE, { text: 'Reworded, italic untouched.', italic: false })
expect(saved.ok).toBe(true)
expect(saved.data!.changed).toEqual(['text'])
expect(draftNode(A_HEADLINE).text).toBe('Reworded, italic untouched.')
expect(draftAxes(A_HEADLINE)).not.toHaveProperty('fontStyle')
```

`A_HEADLINE` already reports `italic: false`, so no fixture changed. The last
assertion is the one the report did not name but the AC's own words require —
passing the status quo through must not *write the default in*.

**Mutation-verified.** The report's own falsifier was executed against the tree:
`packages/site-schema/src/l1/edit.ts` `lockError`, mutated from
`field.type === 'color' ? sameColor(value, current) : value === current` to
`... : false`. Result: `1 failed | 8 passed` — `test_UAT_AC1120` and only
`test_UAT_AC1120` fails (`AssertionError: expected false to be true`, the
`saved.ok` assertion). Before this change that same mutation left the whole
evidence set green. `edit.ts` was restored from a backup taken before the
mutation and `git diff` on it is empty; the commit touches test files only.

### Finding 2 — where the delegation is now recorded

One comment block in each of the three AC-988 test headers
(`write-path.test.ts:511`, `image-selection.test.ts:533`,
`typography.test.ts:742`) naming the tests that prove, through the same
production paths, the two kinds AC-988 enumerates but does not itself exercise:

- colour refusals → `test_UAT_AC1271`
- status-quo carve-out → `test_UAT_AC1272`, `test_UAT_AC1276` (colour),
  `test_UAT_AC1121` (a bound), `test_UAT_AC1120` (a locked non-colour — new)

The report's warning about the densely cross-referential ACs was honoured: no
absence-assertion was widened, no relaxed count (`toBeGreaterThan(0)`,
`.slice(0, 2)`) was re-pinned.

## Verification

`npm test -- <the 7 evidence files>`, run to completion in this session:

```
Test Files  7 passed (7)
     Tests  53 passed (53)
```

Note for the next assessor: **the origin-driven specs passed here.** The
previous report recorded `45 passed / 7 failed / 1 skipped` from
`Error: listen EPERM ... 0.0.0.0` at `tools/generate/src/cli/builder.ts:363`.
This session's sandbox permits the bind, so AC-1024, AC-1026, AC-992, AC-1048,
AC-1111 and AC-1273 were executed rather than read-verified, and are green. The
count is still 53 because Finding 1 added assertions to an existing test rather
than a new one.

## Code Edits

None. The only touch to `packages/site-schema/src/l1/edit.ts` was the temporary
mutation described above, reverted and confirmed byte-identical.

## needs_review Items Forwarded

None. Neither finding was `needs_review`, and none was auto-defaulted under
BUG-1306.

## Carried Forward (out of scope, unchanged)

The report's latent robustness note stands and was not acted on: `startBuilder`
(`tools/generate/src/cli/builder.ts:356-374`) resolves only from the `listening`
callback and attaches no `'error'` handler, so a bind failure surfaces as an
opaque uncaught exception. That is production code owned by the builder-transport
story, not by CAP-86's matrix.
