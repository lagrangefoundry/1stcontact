---
uid: report-1844ccde
id: REPORT-1958
type: report
title: 'Reconciliation Review: commits (REQ-138 — copy modal live preview)'
created_by: xgd
created_at: '2026-08-13T01:30:24.353565+00:00'
updated_at: '2026-08-13T01:30:24.353565+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: reconciliation_review
  subject_uid: request-1ff09fab
  anchor_uid: request-1ff09fab
---

# Reconciliation Review: Story Coverage

**Result**: FAIL
**Mode**: commits
**Surface**: —
**Anchor**: request-1ff09fab (REQ-138)
**Stories Reviewed**: 1 (story-3bf94bd4 / STORY-101)

## Intent (ticket body + comments)

The body is unambiguous: changing **Size, Weight, Italic or Capitalisation** in
the copy modal's parameter sheet must **immediately restyle the words in the
editing box**, so the operator judges the change before choosing Save or Cancel.
Size is *scaled* by the opening ratio rather than re-clamped; only a parameter
actually changed overrides the opening dressing; colour and image framing are
declared out of scope.

**The comments do not agree with the body, and that is the finding.**
`comment-a5255c4d` (chat transcript, `updated_at` 2026-08-13T01:23:10Z — after
the reconciliation plan was written) ends with the operator reporting, **four
times, unanswered**:

> Capitalization is not previewing

The plan (report-865b2ed5) states "No chat comments on the anchor refine or
supersede the body." That was true when the plan was written and is not true
now. The stories and ACs generated from that plan assert capitalisation
previews; the operator says it does not; nothing in the matrix flags the
discrepancy.

## Behavior Inventory

Three behaviours in `1e8bd907` (`editor.js` +30/-3, `page-style.js` +80):

1. **The box follows the sheet** — `defaultModal` subscribes to the parameter
   sheet's `change` and writes one `--preview-*` property per confirmed field
   (`previewVarFor`); commit stays `buffered`, so nothing posts.
2. **Preview size is scaled, not re-clamped** — `previewScale` /
   `previewSizePx`: opening previewed px per authored px, floor 14px, no
   ceiling, degrading to scale 1 when either end is missing.
3. **Only what was changed overrides the opening dressing** — one property per
   event; untouched axes (colour, family, letter-spacing) keep REQ-121's values.

## Coverage Map

| # | Behavior | Coverage | Story | Notes |
|---|----------|----------|-------|-------|
| 1 | The box follows the sheet — size, weight, italic | Covered | story-3bf94bd4 | AC-1138 |
| 1b | **Capitalisation restyles the words** | **Absorbed divergence** | story-3bf94bd4 | AC-1138 claims it; reproducibly it does not happen. See Finding 1 |
| 1c | An "off" value clears the property it set | Covered (weight/italic); **absorbed divergence** for capitalisation | story-3bf94bd4 | AC-1138 |
| 1d | Nothing is written — buffered, no POST, no re-render | Covered | story-3bf94bd4 | AC-1138, consistent with AC-997/AC-1123 |
| 1e | A parameter with no entry in the table shows nothing | Covered (unasserted) | story-3bf94bd4 | AC-1138 ¶3; colour is the live example, minor |
| 2 | Changed size previews at the opening scale, floor kept, no ceiling | Covered | story-3bf94bd4 | AC-1139, AC-1042 scoped to the opening size |
| 2b | Quiet degradation (unreadable/absent/non-numeric size) | **Partial** | story-3bf94bd4 | Claim stated in AC-1139, no covering assertion. See Finding 3 |
| 3 | Only a changed parameter overrides the box; inherited weight survives | Covered | story-3bf94bd4 | AC-1140, incl. a real-browser cascade case |
| 4 | Declared out of scope: colour, image framing | Covered | story-3bf94bd4 | Story "Out of scope" + Technical Context ("a row this table gains") |

## Findings

### Finding 1 — BLOCKING. Capitalisation does not reach the words; AC-1138 says it does (silent divergence absorption)

**AC-1138** (`acceptance_criterion-2d587432`) states: "Each of the parameters a
run of copy exposes reaches the box as the operator confirms it — how big, how
heavy, italic or not, **capitalised or not**", and its Verification says
"choose a capitalisation … assert the box's copy is now set that way … choosing
no capitalisation returns it to the words as typed".

This does not happen, and the cause is structural rather than incidental:

- `builder.css:253` sets `text-transform: var(--preview-text-transform, none)`
  on `.builder-modal__box` — the **container**.
- The words are displayed by the mounted `webui-fields` control
  (`.fields-control`, an `input`/`textarea`; the copy box's lone control is
  auto-opened per AC-1044). `fields.css` gives it `font: inherit`, which carries
  family, weight, style and size — **`text-transform` is not part of the `font`
  shorthand**, and the UA stylesheet resets it on form controls.

Reproduced directly in Chromium (`/tmp/probe-tt.mjs`): a `<textarea>` and an
`<input>` inside a div with `text-transform: uppercase; font-weight: 700;
font-style: italic` compute `{transform: "none", weight: "700", style:
"italic"}` and render in the original case in the screenshot. Weight, style and
size land; capitalisation does not. That is exactly the operator's report.

Grep confirms nothing else re-applies it: `--preview-text-transform` has exactly
two consumers (`builder.css:253`, `page-style.js`), and the installed
`webui-fields` package contains no `text-transform` rule at all.

Note this is also true of the **opening** dressing (`readPageStyle` has written
`--preview-text-transform` since REQ-121), so it is a pre-existing hole that
REQ-138 newly asserts over — not a regression introduced by this commit.

**Why this fails the review**: reconciliation records what the code does, and
where code diverges from intent the matrix must **capture the intent and note
the discrepancy**, not silently accept it. As written, a developer reading
STORY-101 would believe all four typography parameters preview live. Three do.

**Remediation for the fix loop** (reconciliation permits no runtime code
changes, so the fix is in the matrix):
1. Scope AC-1138 (criterion **and** verification) to the parameters that
   actually reach the words — size, weight, italic — and state plainly that
   **capitalisation is written as `--preview-text-transform` on the box but does
   not reach the copy, because the control that displays the words resets
   `text-transform`**; record it as a known divergence from REQ-138's stated
   intent, with the operator's report as its source.
2. Do the same for the "turned back off clears it" paragraph, which currently
   uses "choosing no capitalisation returns it to the words as typed" as one of
   its two worked examples.
3. Mirror the scoping in the STORY-101 body ("The box follows the sheet"
   currently reads "Every parameter a run exposes reaches the box as it is
   confirmed").
4. The missing capability itself is a separate upgrade/bug ticket, not this
   reconciliation's business.

### Finding 2 — BLOCKING (Step 5b). AC-1138's UAT cannot distinguish working from broken

`test_UAT_AC1138_each_parameter_restyles_the_box_as_it_is_confirmed_and_writes_nothing`
(`tests/reconciliation-copy-edit-live-preview.test.ts:386`) passes on this
machine — I ran it: 3 passed, webui installed, chromium available, no
`NOT VERIFIED` warnings, so both the jsdom and the browser halves executed.
It passes while the behaviour the AC promises is absent, because every
capitalisation assertion is made on the **wrong node**:

- jsdom half (line 429): `box.style.getPropertyValue('--preview-text-transform')`
  — asserts the property was *written*, which is not in dispute.
- browser half (lines 483-486, 498-500):
  `getComputedStyle('.builder-modal__box').textTransform` — the container the
  property is set on, not the control that shows the words. It reads
  `uppercase` while the copy renders unchanged.
- the "wiring" half (lines 391-405) asserts a regex over the **text of
  `builder.css`**. Per the evidence rules this is source inspection: it proves
  a declaration exists, not that any behaviour occurs.

The same test's weight and italic assertions are sound, because those axes do
inherit into the control — the proxy happens to hold for them and is false only
for `text-transform`, which is why the suite went green over a live defect.

**Remediation**: assert on the element that holds the words —
`.builder-modal__box .fields-control` (or whatever node currently displays the
copy) — for each parameter, in the browser half. On today's code that assertion
fails for capitalisation, which is the correct outcome once AC-1138 is scoped
per Finding 1 (the assertion then belongs to whatever the AC ends up claiming,
e.g. asserting the copy's rendered weight/style/size follow the sheet).

### Finding 3 — Secondary. AC-1139 states a degradation rule nothing asserts

AC-1139's final paragraph claims: "a run whose opening size cannot be read, and
a run that declares no size of its own, preview changes at the size asked for
rather than not at all; and a size that is not a readable positive number leaves
the box's previewed size as it was."
`test_UAT_AC1139_a_changed_size_previews_at_the_scale_the_box_opened_at`
(line 506) covers the clamped run, the in-range run, the floor and the absent
ceiling — nothing exercises any of the three degradation cases (all three
fixture runs declare a size, and no unreadable value is driven). Either add the
assertions or drop the clause; an unasserted claim in an active AC is the shape
this review exists to catch.

## Ungrounded Stories

None. Everything STORY-101 claims is supported by the intent or by the code;
the failure is the opposite — an intent claim the code does not deliver, recorded
as though it does.

## Plan Item Accounting

| Plan Item | Expected Story | Status |
|-----------|---------------|--------|
| 1. Copy edit modal — the editing box follows the parameter sheet (upgrade) | story-3bf94bd4 | ✓ — body extended with "The box follows the sheet"; AC-1138/1139/1140 added; AC-1042 rescoped to the opening size as the plan required |

No plan items dropped.

## Judgment Calls

- **AC-1138 ¶3 ("a parameter the box cannot show is not guessed at") has no
  direct assertion** — accepted. Colour has no control, so the claim is
  unobservable through the operator's interface; it is a property of the table's
  shape, already argued in the story's Technical Context.
- **AC-1042's rescoping is faithful** — its behaviour and verification are
  untouched and it now says the range applies to the opening size alone.
  Without it the matrix would contradict a preview that grows past 32px.
- **AC-1140's browser half is good evidence** — it introduces real inheritance
  into the rendering and asserts the box previews the rendered 700 while the
  sheet reports 400. That is the divergence the implementation's shape was
  chosen against, verified in an engine that cascades.
- **The webui skip gate is not counted against this review** — the components
  resolve on this machine and the suites ran for real. The gate is documented in
  the story's Technical Context and is a known repository-wide caveat.
- **Capitalisation is material, not trivial** — it is one of the four parameters
  the intent names in its first sentence, the operator raised it four times, and
  a reader of these stories would be surprised to find it inert.

## Verdict

**FAIL.** Two blocking problems, both about the same axis. STORY-101 records
that changing Capitalisation restyles the words in the editing box; it does not,
because the property is written on the box while the words live in a form
control that resets `text-transform` — reproduced in Chromium and reported by
the operator four times on the anchor ticket after the plan was written. The
covering UAT passes anyway, because it measures the container rather than the
copy, so the matrix has absorbed a live divergence with green evidence behind it.

The fix loop should scope AC-1138 (and the STORY-101 body) to the parameters
that actually reach the words, record capitalisation as a stated divergence from
REQ-138's intent, and re-point the UAT's assertions at the element that displays
the copy. AC-1139's unasserted degradation clause should be asserted or dropped
in the same pass.
