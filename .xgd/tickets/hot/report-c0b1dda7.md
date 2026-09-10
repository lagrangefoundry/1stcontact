---
uid: report-c0b1dda7
id: REPORT-3817
type: report
title: 'Fix In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
  (ac) — attempt 6'
created_by: xgd
created_at: '2026-09-10T23:37:22.168932+00:00'
updated_at: '2026-09-10T23:37:22.168932+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: ac
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture (ac)

**Attempt**: 6
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All four findings that carried a resolution category in report-efb2ed3c (V1, W1,
W2, W3) are applied. Findings 5–9 are `info` and explicitly carry no action; none
of attempt 5's work was undone.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-997 (`acceptance_criterion-e2413484`) | **V1 (the violation).** Replaced the closed "two controls" enumeration with the derivation: the merge now holds "across **however many controls the region's fields were spread across** — that count is derived from what the region exposes, never written down here", and the image illustration names all three (grid the dialog draws itself + editing box for alt text + parameter sheet for framing/shape/adjustment), citing AC-1123 for the routing rule rather than restating it. Verification's image leg extended by the missing step: alter the thumbnail, the alt text **and one framing parameter in the sheet**, assert one change carries all three and one re-rendering. The *only-what-was-touched* paragraph and its picker-re-report clause are preserved verbatim (only "either control" → "any control", forced by the three-way composition) |
| 2 | ac-edit | AC-1123 (`acceptance_criterion-35907074`) | **W1.** Carved the image-options descriptor out of the routing enumeration in one clause, deferring the grid to AC-1112 as prescribed: "…a field whose descriptor declares that its options are images is drawn as the grid this dialog draws itself (AC-1112); every other shape a region can expose — … — is drawn in the sheet." Criterion and Verification now agree. No other sentence touched; the Verification (repaired at 23:17Z) is unchanged |
| 3 | ac-edit | AC-1000 (`acceptance_criterion-43e5a016`) | **W2, half 1.** Stale witness replaced: "a dialog whose only control is the thumbnail grid — a region that exposes nothing but which image it carries" → "a dialog with no editing box at all — a painted backdrop, whose controls are the thumbnail grid for its background image and the colour row for its fill", untouched-confirm now keyed on "no tile chosen and no colour picked". Verification's repeat leg likewise. The universal opening sentence ("This spans **every control the dialog holds**") is untouched |
| 4 | ac-edit | AC-1043 (`acceptance_criterion-8acf277e`) | **W2, half 2.** "a dialog that is all thumbnails and no text" → "a dialog with no editing box at all — a painted backdrop, whose controls are its thumbnail grid and its colour row"; Verification's "a dialog that exposes only an image choice" → "a painted backdrop's dialog — its picker and its colour row, with no editing box". The narrowing key — "the absence of **any editing surface**" — is untouched, which is what the covering assertion (`.builder-modal__form` is null) actually reads |
| 5 | story-body-edit | STORY-101 (`story-3bf94bd4`) | **W3, carried forward since report-657d1e9a finding 4 / report-1321eb22 finding 2.** Added one in-scope bullet — "The dialog is dressed as the workspace's own" — between the dialog-composition bullet and "The page updating": themed subtree and palette resolution with no hardcoded stand-ins, a theme switch reaching an open form, the single application typeface applied once at the themed root, the family as an application constant rather than a theme value, self-hosted faces, Cancel/Save reading as the workspace's own controls, and the declared refusal-colour exception. Wording derived from REQ-121 (`request-9707484c`, free_and_reconciled) items 1, 2 and 4 via AC-1037 and AC-1038, so the body now states what those two ACs assert. **AC-1037 and AC-1038 were not touched** — the report is explicit that they are correct and must not be deprecated to match a thin body |

Every edit was applied with `xgd ticket update --body-file`; no ticket file was
edited directly. All five bodies were rewritten in full from the store's current
text, so no unrelated passage moved.

## Prophylactic Sweep (the report's standing instruction)

The report warns that the closed-enumeration shape has recurred six times and
that "an editor applying finding 1 should assume the shape recurs rather than
that this sweep was exhaustive". I re-pulled all 40 STORY-101 AC bodies and
grepped for the shape (`two controls`, `only control`, `all thumbnails`,
`no form at all`, `has no control for`, `exactly two`, `both controls`, …).
Four hits, **all four correct as written**:

| AC | Hit | Verdict |
|---|---|---|
| AC-1140 | "the run's **family**, which the sheet has no control for at all" | Correct — `copyFieldsOf`'s text branch derives colour + typography, no family field (`edit.ts:963-985`). This is the surviving witness attempt 5 deliberately kept |
| AC-1050 | a painted panel's picker "and no text-editing box" | Correct, and finding 8 says do not narrow it — it already asserts both halves (image where present, colour always) |
| AC-1112 | "Two controls answering the same question is the failure this replaces" | Correct — about the removed path dropdown, not a region's field count |
| AC-1282 | "is not offered as operable to a screen reader" | Correct — the lock rule, unrelated shape |

No sixth-instance candidate remains under either story. STORY-98's 14 ACs were
not swept for this shape (the report re-verified them independently and found no
finding); they contain no dialog-composition claim.

## Code Facts Re-verified Before Editing

I read the source rather than trusting the report's citations:

- `packages/site-schema/src/l1/edit.ts:987-1005` — the image branch returns
  `src` (`type: 'enum'`, `format: 'image'`), `alt`, then `...framing.fields`.
  Three routes, confirming V1's "three, not two" and W1's carve-out.
- `edit.ts:1022-1024` — `colorField('surfaceFill', …)` is derived for every
  painted box/container unconditionally, with the in-source comment stating why
  ("that is also why the fill is derived even when the node holds none").
  Confirms W2: no node kind yields an image field alone, so "all thumbnails"
  describes no region that exists.

## Code Edits (if any)

None this call. Every finding with a resolution category was `ac-edit` or
`story-body-edit`; no finding was categorized `code-issue` and none of my own
reading reached that conclusion.

## Tests

Not run this call, and no test file was modified. Per finding 7 the covering
suites cannot execute in this sandbox — `startBuilder` fails with
`listen EPERM: operation not permitted 0.0.0.0`
(`tools/generate/src/cli/builder.ts:362-363`) in each suite's `beforeAll`, which
is the sandbox refusing to bind a socket, not a failing assertion. Running them
would have produced the same three errors and no new information.

## Follow-on for the uat level (not actioned here — different field owner)

**AC-997's Verification now asks for one step its UAT does not yet perform.**
The added leg — alter thumbnail + alt text + one framing parameter, assert a
single change carries all three — is the exact composition REQ-136 created and
the gap V1 named ("nothing in the matrix asserts that a framing parameter staged
in the sheet merges into the same single change"). The AC now asserts it; the
covering test (`tests/reconciliation-copy-edit-image-picker.test.ts:657-693`)
still stops at thumbnail + alt text.

I deliberately left `AC-997.uat_coverage` at `pass` rather than flipping it:
that field is owned by `check_uat_coverage` / `fix_uat_coverage`, and setting it
by hand from a structural-validation pass would either manufacture progress or
manufacture a failure the uat level is going to re-derive anyway. Flagging it
here is the honest handoff. The other three AC edits are within their existing
tests' reach — AC-1123's Verification is unchanged, and AC-1000/AC-1043 now
describe the witness their tests already use (`image-picker.test.ts:704-710`
asserts `.builder-modal__form` is null, i.e. "no editing box", which is exactly
the repaired wording).

## needs_review Items Forwarded

None. No finding in report-efb2ed3c was categorized `needs_review`.
