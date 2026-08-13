---
uid: report-4e8a035d
id: REPORT-1964
type: report
title: 'Reconciliation Review: commits (REQ-138 — copy modal live preview)'
created_by: xgd
created_at: '2026-08-13T01:47:49.498106+00:00'
updated_at: '2026-08-13T01:47:49.498106+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: reconciliation_review
  subject_uid: request-1ff09fab
  anchor_uid: request-1ff09fab
---

# Reconciliation Review: Story Coverage

**Result**: PASS
**Mode**: commits
**Surface**: (n/a — commits mode)
**Anchor**: request-1ff09fab (REQ-138)
**Stories Reviewed**: 1 (story-3bf94bd4 / STORY-101)

## Intent (Step 1)

The anchor is a request ticket and IS the intent. Body + its one comment
(comment-a5255c4d) read; nothing there refines or supersedes the body.

The operator asked for: changing a typography parameter in the copy modal's
parameter sheet (**Size, Weight, Italic, Capitalisation** — four named) restyles
the words in the editing box immediately, so the choice between Save and Cancel
is made by looking. Two design decisions are stated as load-bearing: size is
**scaled by the opening ratio, not re-clamped**; and **only a parameter the
operator actually changed** overrides the box, because the opening vars are the
cascaded render while descriptor values are only what the node overrode.
Declared out of scope: colour (no descriptor — deferred to REQ-133) and image
framing (REQ-136).

## Behavior Inventory

Read independently from the commit (`ebd789faa`, working head `1e8bd9077`):
`page-style.js` (+`previewScale`, `previewSizePx`, `PREVIEW_PARAMETERS`,
`previewVarFor`) and `editor.js:386-392` (the `properties.on('change')`
subscription, guarded on `box`, scale measured once at open). 11 behaviors
across 3 features. Buffered commit untouched — the subscription writes only
custom properties on the box.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | Size / weight / italic reach the box as each is confirmed, by its own gesture | Covered | story-3bf94bd4 (AC-1138) | Asserted on the words, not the wrapper |
| 2 | Capitalisation is written on the box but never reaches the words | Covered — **as a recorded divergence** | story-3bf94bd4 (AC-1138) | See Judgment Calls |
| 3 | An "off" value clears the property it set rather than leaving the last standing | Covered | story-3bf94bd4 (AC-1138) | italic un-tick asserted in the rendering |
| 4 | A parameter with no table entry writes nothing (colour is the live absence) | Covered | story-3bf94bd4 (AC-1138) | "not guessed at" clause |
| 5 | Nothing is a write: no POST, no re-render, no origin contact; cancel leaves no trace | Covered | story-3bf94bd4 (AC-1138) | draft asserted byte-for-byte |
| 6 | Changed size previews at the opening scale, not re-clamped | Covered | story-3bf94bd4 (AC-1139) | Precondition (opened < authored) asserted first |
| 7 | Scale folds the editing clamp and the responsive-track difference into one ratio | Covered | story-3bf94bd4 (AC-1139) | |
| 8 | 14px floor kept; no ceiling (the box scrolls) | Covered | story-3bf94bd4 (AC-1139) | both saturation and non-capping asserted |
| 9 | One property per change; every untouched axis keeps its opening dressing | Covered | story-3bf94bd4 (AC-1140) | colour/family/letter-spacing are the witnesses |
| 10 | An inherited weight survives an unrelated change (the two sources must not be conflated) | Covered | story-3bf94bd4 (AC-1140) | browser half, real cascade |
| 11 | Opening dressing (REQ-121) unchanged; the clamp scopes to the OPENING size | Covered | story-3bf94bd4 (AC-1042, rescoped) | regression suites green |
| 12 | Degrade to scale 1 when either end of the ratio is missing | Uncovered — acceptable | — | Guard, not a criterion: a run declaring no size gets no size control, so no gesture reaches it. Story states this explicitly. |

## Ungrounded Stories

None. Every claim in the story's "The box follows the sheet" section maps to
code I read; nothing is invented.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Copy edit modal — the editing box follows the parameter sheet (upgrade) | story-3bf94bd4 | ✓ |
| — add AC (a) live restyle, off clears, buffered untouched | AC-1138 | ✓ |
| — add AC (b) scaled not re-clamped | AC-1139 | ✓ |
| — add AC (c) only what changed overrides | AC-1140 | ✓ |
| — modify AC-1042 (scope to the OPENING size) | acceptance_criterion-6a9ace26 | ✓ retitled "The size the box OPENS at…" and the live rule cross-referenced |
| — remove: none | — | ✓ |

No plan items dropped.

## Step 5b — Evidence Sufficiency (mutation-verified)

Evidence: `tests/reconciliation-copy-edit-live-preview.test.ts`, three UATs named
`test_UAT_AC1138_*`, `test_UAT_AC1139_*`, `test_UAT_AC1140_*`. They drive the
real `mountEditor` over a real `1c render --edit` page through a real builder
origin, by user gestures (click the row, type, blur; select; toggle). **No
internal mocking** — the only substitution is a `fetch` wrapper that records
calls and delegates to the real one, which is how "nothing was written" is
asserted. No source-text inspection; the suite comments explicitly reject
stylesheet regexes as the mistake that previously let a defect go green.

Verified as passing here: 3/3 green, and both guards (`WEBUI_INSTALLED`,
playwright resolvable) are satisfied on this machine — no `NOT VERIFIED`
warnings emitted, and the Playwright halves demonstrably execute (they are what
fails under mutations B and D below).

I ran four mutations to answer "could a broken implementation pass?":

| Mutation | Result |
|---|---|
| A — remove the `properties.on('change')` subscription entirely (pre-REQ-138 behaviour) | **3/3 fail** |
| B — the naive re-clamp: `clampPreviewSize(value)` for `previewSizePx(value, scale)` | **AC-1139 fails** (AC-1138 too, via its size assertion); AC-1140 correctly survives |
| C — re-derive the whole dressing from `getValues()` on every change | **AC-1140 fails, alone** — "the weight did not move: expected '400' to be ''" |
| D — close the divergence: make `text-transform` inherit to `.fields-control` | **AC-1138 fails** — "and does NOT reach the words: expected 'uppercase' to be 'none'" |

Each criterion is killed by precisely the wrong implementation it was written
against, and by no other. Mutation D confirms the recorded divergence is a
**live, falsifiable** claim rather than a permanently-true tautology: the day the
words are drawn in something carrying the property, the evidence fails and says
so, exactly as AC-1138 promises.

Working tree restored clean after every mutation (`git status --porcelain` empty).

Regression scope re-run: `test_UAT_FC_REQ-138_live_preview.test.ts` plus the
form-presentation, parameter-sheet and typography suites — 24/24 pass, so
AC-1042's rescoping did not disturb the opening dressing it now scopes to.

## Judgment Calls

- **The capitalisation divergence is handled correctly, and this is the review's
  central question.** REQ-138 names four parameters; three reach the words. The
  story does **not** absorb this silently — it is recorded in three places (story
  Technical Context, AC-1138's criterion text, and the test's own assertions),
  the mechanism is named (`font: inherit` carries family/weight/style/size and
  not `text-transform`, which the UA resets on form controls), and the criterion
  claims three rather than silently claiming four. I verified the AC's factual
  defence: `--preview-text-transform` has been written on the box since
  `68360f229e` (2026-08-07, REQ-121's opening dressing), five days before the
  REQ-138 commit — so "not a regression introduced here; the live preview merely
  made it visible" is accurate. Per Step 5, silent absorption is a FAIL and this
  is its opposite: flagged, explained, and pinned by a two-sided assertion.
- **Behavior 12 (degrade to scale 1) omitted as a guard, not a gap.** Acceptable:
  a run that declares no size of its own is given no size control, so no operator
  gesture reaches the path and no AC could carry an assertion for it. The story
  says so in as many words rather than leaving it unexplained.
- **Colour's absence read as a planned row, not an omission.** The intent declares
  it out of scope; `PREVIEW_PARAMETERS` is a table with no colour row; the story
  records it as "a row this table gains when the palette control lands". A later
  reconciliation reading this as a gap would be misreading it.
- **`story-3bf94bd4.fields.uat_coverage: fail` is pre-existing and out of this
  review's scope.** First set 2026-08-10 (`24bda30b5`), two days before the
  REQ-138 implementation commit; it is unchanged by this reconcile. It is a
  matrix-structural signal owned by structural validation, not story coverage.
  Noted rather than acted on.
- **The `report-843ab059` quality report carries `suites: {}`** (lint/build only,
  no suites executed). Not a story-coverage finding, so it does not bear on this
  verdict — but flagged for the operator, since a quality gate that ran zero
  suites proves nothing about the tests. I executed the relevant suites directly
  and report their real results above.

## Verdict

**PASS**. Stories accurately and completely document the behavior surface within
the intent's declared scope. The one place code diverges from intent —
capitalisation is written but does not reach the words — is captured as an
explicit, mechanism-explained, test-pinned divergence rather than absorbed as
correct behaviour, which is precisely what this review exists to check. All plan
items produced output. Every active AC has a passing UAT that enters through the
real user-facing gesture, mocks nothing internal, inspects no source text, and is
killed by the specific wrong implementation it was written against. A developer
reading these stories would have a correct mental model of what the operator
intended to build, including what they asked for and did not get.
