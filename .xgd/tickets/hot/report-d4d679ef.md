---
uid: report-d4d679ef
id: REPORT-3783
type: report
title: 'UAT Coverage: Structured Copy Editing: One Validated, Atomic Write Path'
created_by: xgd
created_at: '2026-09-10T19:35:38.233146+00:00'
updated_at: '2026-09-10T19:35:38.233146+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-f753cecd
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: Structured Copy Editing: One Validated, Atomic Write Path

**Result**: PASS
**AC verdicts**: 43 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 1 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

Anchor report: report-e37a6b4a · Capability: capability-f753cecd (CAP-86) ·
Story: story-37a3921b (STORY-100, `story_kind: upgrade`) · 43 active ACs ·
53 UAT functions across 7 files · previous_attempt_count: 4.

Zero violations, zero warnings, zero needs_review. The single violation and
single warning of the previous round (report-d7beaba8) were both resolved by
report-cd708ee9 / commit `b0efd5fdba`, and both were re-verified against the
tree in this session rather than taken on the fix report's word. Nothing new
was found. The only field this round had to write is the capability aggregate,
which was stale at `fail` while every child already read `pass`.

## Cumulative Intent Considered

The capability carries one story. Its `intent_uid` is BUNDLE-16
(`free_and_reconciled`, merged at `1741ee5d`, "REQ-117 + REQ-115 + REQ-44") and
its `updated_by` is BUNDLE-19 (`free_and_reconciled`, merged at `b18b859d`,
"REQ-133 + BUG-35 + REQ-131 + REQ-140 + REQ-139 + 4 more"). No AC in this
capability carries its own `intent_uid`/`updated_by`; the story's two bundles
are the whole ledger. Both are `free_and_reconciled` — every intent below
counts, and none of them retires a behaviour another one introduced.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 | free_and_reconciled | 2026-07-03 | Tooling hygiene, bundled with the story's originating intent | YES |
| REQ-82 | free_and_reconciled | 2026-07-20 | L1 substrate + safety envelope — the structured-only invariant this surface inherits (AC-991) | YES |
| REQ-114 | free_and_reconciled | 2026-07-31 | L1 palette colour model — the substrate a colour reference names | YES |
| REQ-115 | free_and_reconciled | 2026-07-31 | Builder shell — the origin AC-992 is asserted over | YES |
| REQ-117 | free_and_reconciled | 2026-07-31 | Copy editing end-to-end: address → fields → validated diff → re-render (AC-980–992) | YES |
| REQ-118 / REQ-119 | free_and_reconciled | 2026-08 | Image selection and its alt text as the second half of the same surface (AC-1024–1027, AC-1111) | YES |
| REQ-131 / REQ-132 | free_and_reconciled | 2026-08-12 | A painted panel's background image through the same path (AC-1045–1049) | YES |
| REQ-133 | free_and_reconciled | 2026-08-12 | Palette popup — display, pick and edit the site's colours | YES |
| REQ-135 / REQ-136 | free_and_reconciled | 2026-08-12 | Text properties: size, weight, italic, capitalisation (AC-1117–1122) and image framing (AC-1129–1132) | YES |
| REQ-137 | free_and_reconciled | 2026-08-12 | `shade` on the reference replaces named steps | YES |
| REQ-139 | free_and_reconciled | 2026-08-12 | Lock a control that cannot express what the element holds, with its reason (AC-1273–1277) | YES |
| BUG-35 | free_and_reconciled | 2026-08-13 | Capitalisation preview | YES |
| REQ-140 | free_and_reconciled | 2026-08-15 | Colour: a run's text colour and a panel's fill, from the palette (AC-1269–1272, 1274–1276, 1278) | YES |
| REQ-141 / 142 / 144 / 123 | free_and_reconciled | 2026-08-15 | Also bundled into BUNDLE-19; no behaviour of this capability | YES |
| BUNDLE-16 | free_and_reconciled | 2026-07-31 | The story's `intent_uid` | YES |
| BUNDLE-19 | free_and_reconciled | 2026-08-18 | The story's `updated_by` | YES |

No intent in the ledger retires a behaviour any AC here describes, so Step 1a's
deprecation case is not triggered anywhere and no AC is `deprecated`. No AC
contradicts an intent, so no `ac-edit` finding arises. The story body carries no
`## Reconciliation Decisions` heading and needs none — nothing it claims is
intent-silent (see the two probes below), so no finding reaches the BUG-1306
impact screen at all this round.

Two clauses were re-probed independently this round because they are the least
obviously derivable from a headline, and both are supported outright rather than
intent-silent:

- **"the reason travels to … the AI's own tool surface"** (story body, in-scope
  list). This is not an unproven claim about a separate AI endpoint: the story's
  own Technical Context states the mechanism as *"the descriptor carries the
  unavailability and its sentence as a single value"*, read by three consumers
  — the browser draws it, the command line prints it, and a refused write
  returns it verbatim. All three consumers read one field
  (`L1FieldDescriptor.reason`, `packages/site-schema/src/l1/edit.ts:270`), and
  the two that are in this capability's scope are asserted: AC-1277 (the command
  line marks an unavailable field with its reason) and AC-1276 (a refusal
  carries that field's own reason). The browser is the gesture capability, which
  CAP-86's body puts out of scope.
- **The conditional controls** — *"size is offered only where the run declares
  one of its own and weight only where the site offers more than one"*. Both
  halves are asserted in `typography.test.ts` under AC-1117:
  `:420-421` (a run declaring no size is offered no `fontSizePx` field and
  reports no value for it) and `:451-459` (a family yielding fewer than two
  weights is offered no weight chooser).

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-100 | REQ-82, REQ-114, REQ-115, REQ-117, REQ-118, REQ-119, REQ-131, REQ-132, REQ-133, REQ-135, REQ-136, REQ-137, REQ-139, REQ-140, REQ-44, BUG-35 (via BUNDLE-16, BUNDLE-19) | **aligned**, coverage `pass` | Body re-read in full (53,352 chars). Every behaviour it describes traces to a reconciled intent; every behaviour the ledger called for is present. Its "Where the intent and the implementation differ" section records the two known divergences — the empty-region message (owned by the gesture capability) and the withheld size control on a run declaring no size — as *open rather than absorbed*, which is the honest form and not drift. The clause that was uncovered last round (AC-1120's non-colour status-quo carve-out) is now proven |

Per-file evidence, all re-read this cycle:

| File | ACs | Outcome |
|---|---|---|
| `reconciliation-copy-edit-write-path.test.ts` | 980–992 (13) | covered |
| `reconciliation-copy-edit-image-selection.test.ts` | 1024–1027, 981, 986, 988, 991, 992 | covered |
| `reconciliation-copy-edit-background-selection.test.ts` | 1045–1049 (5) | covered |
| `reconciliation-copy-edit-field-format.test.ts` | 1111 | covered |
| `reconciliation-copy-edit-typography.test.ts` | 1117–1122, 980, 988, 991 | covered |
| `reconciliation-copy-edit-image-framing.test.ts` | 1129–1132, 1121, 1122 | covered |
| `reconciliation-copy-edit-colour-and-availability.test.ts` | 1269–1278 (10) | covered |

**Test-name sweep, run independently of the index.** `.xgd/uat_index.json` is
empty (`acs: {}`) in this worktree, so AC→test resolution was rebuilt by
scanning every `.ts`/`.tsx`/`.js`/`.mts` file in the tree for
`test_UAT_…AC<n>_…`. Result: **all 43 ACs resolve to at least one test; none is
unmatched.** The scan is the reason this report does not depend on the index.

**Evidence validity, re-verified.** A sweep of the seven files for `vi.mock` /
`vi.fn` / `.skip(` / `.only(` / `.todo(` / `jest.mock` / `stub` returns no
mocking construct — the only `stub` hits in the tree are in
`reconciliation-copy-edit-colour-row.test.ts`, a different file belonging to the
out-of-scope gesture capability. Every evidence file imports the real entry
points (`cmdNew`, `cmdRender`, `run`, `startBuilder` from
`tools/generate/src/cli`) and asserts over the bytes of the draft page document
and the rendered channels on disk. Spot-read in full this round rather than
sampled by name: AC-983 (atomicity asserted through `status`' modified/added/
removed sets, not through a return value), AC-986 (asserts the shared validator
*by consequence* — a violation planted at a node the edit does not touch makes
`copy set` and `config set` fail with byte-identical code, message and path),
AC-991 (a script+style+markup payload saved and then parsed out of the rendered
HTML with JSDOM, proven inert both as a text run and as an image `alt`
attribute). None of the 53 is trivial, structural or over-mocked.

## Findings — Categorized by Editor Action

None. Both findings of report-d7beaba8 were re-checked against the tree and are
resolved:

| Prior # | Element | Category | Verified this round |
|---|---|---|---|
| 1 (violation) | AC-1120 / `typography.test.ts:561-577` | uat-edit | **Resolved.** The status-quo re-post is present and is the shape the AC's own words require: `set(A_HEADLINE, { text: …, italic: false })` asserts `ok`, `changed` equals exactly `['text']`, the words landed, and `draftAxes(A_HEADLINE)` still has no `fontStyle` — so passing the status quo through does not write the default in. This is the assertion that pins `lockError`'s non-colour branch (`packages/site-schema/src/l1/edit.ts`), the branch a mutation left green before |
| 2 (warning) | AC-988 / three tests | uat-edit | **Resolved.** The delegation is recorded as header comments at `write-path.test.ts:514-518`, `image-selection.test.ts:537-541` and `typography.test.ts:747-752`, naming `test_UAT_AC1271` for the colour refusals and `test_UAT_AC1272`/`AC1276`/`AC1121`/`AC1120` for the status-quo carve-out. No absence-assertion was widened and no relaxed count re-pinned, exactly as the previous report asked |

## Notes for the Editor

**Field writes this round.** All 43 ACs and the story already carried the
`uat_coverage` value this assessment arrives at (`pass`), confirmed by reading
their fields at the start of the session — after commit `b0efd5fdba`, not
before. Rewriting 44 identical values would have produced 44 no-op commits, so
the only write was the capability aggregate, which was stale at `fail` while
every child read `pass`. That staleness — not any surviving gap — is what put
this capability into a fifth attempt.

**The local test run, and why a red suite here is not a regression.**
`npm test -- <the 7 files>` was run **twice to completion** in this session,
with identical results both times: **45 passed / 7 failed / 1 skipped of 53**,
~181s. Every one of the 7 failures is a 60s/120s timeout whose uncaught cause is
the same environment artifact — `Error: listen EPERM: operation not permitted
0.0.0.0`, thrown from `server.listen` at `tools/generate/src/cli/builder.ts:363`
— and **there is not one `AssertionError` in the output**. The failing specs are
exactly the origin-driven ones (AC-1024, AC-1026, AC-992, AC-1045, AC-1048,
AC-1111, AC-1273, plus the write-path origin `describe` whose `beforeAll` timed
out — that is the "1 skipped", carrying the second AC-992 test), and they are
exactly the tests reaching `withOrigin`/`startBuilder`. This assessor sandbox
denies binding a listening socket; the fix session's did not, and
report-cd708ee9 records all 53 green there. **All 45 non-origin assertions pass
here.** No failure is evidence of a coverage gap and none affected a verdict.

**Latent robustness point, out of scope for this check and unchanged.**
`startBuilder` (`tools/generate/src/cli/builder.ts:356-374`) resolves its
promise only from the `listening` callback and attaches no `'error'` handler, so
a bind failure becomes an opaque uncaught exception and a 60-second timeout
rather than a fast, legible failure. That is production code owned by whichever
story owns the builder transport, not by CAP-86's matrix; it is named here only
because it is what makes a sandboxed run look like seven unrelated failures.

**Scope confirmed clean, again.** `reconciliation-copy-edit-colour-row.test.ts`,
`reconciliation-copy-edit-control-availability.test.ts`,
`reconciliation-copy-edit-parameter-sheet.test.ts` and
`reconciliation-copy-edit-gesture.test.ts` also name copy-edit ACs, but those
ACs belong to the browser-gesture/chrome capability that CAP-86's body
explicitly places out of scope ("how a click becomes an address in a browser …
the chrome that hosts it"). None was counted as evidence for any of the 43 ACs
here.
