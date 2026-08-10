---
uid: report-6aa1d529
id: REPORT-1742
type: report
title: 'Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic
  Write Path (level=ac)'
created_by: xgd
created_at: '2026-08-10T07:27:06.168939+00:00'
updated_at: '2026-08-10T07:27:06.168939+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-f753cecd
  level: ac
  violations: 0
  warnings: 5
  needs_review_count: 0
---

# Capability-Intent Alignment: Structured Copy Editing: One Validated, Atomic Write Path
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 5
**Needs review**: 0

Scope: CAP-86 (`capability-f753cecd`) → STORY-100 (`story-37a3921b`,
`story_kind: upgrade`, so ACs are expected) → **17 acceptance criteria**
(AC-980…AC-992, AC-1024…AC-1027), all `active`. No deprecated, inactive or
archived ACs exist under this story (queried explicitly; all three return 0).
This is attempt 3 of the `ac` cycle; the state below is re-read fresh, not
inherited from REPORT-1614.

## Cumulative Intent Considered

No AC carries an `intent_uid`/`updated_by` of its own, so attribution runs
through STORY-100 (`intent_uid: bundle-15c1f647`, `updated_by:
request-66e4c630`) and, for the AC set, by creation window (AC-980…992 with the
REQ-117 reconcile; AC-1024…1027 at 2026-08-07T04:40, the REQ-118 reconcile).

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-44 (`request-3b78151f`) | free_and_reconciled | 2026-07-03 | `1c` CLI dependency preflight. Not a CAP-86 behaviour. | YES (out of this capability) |
| REQ-115 (`request-a6740b4a`) | free_and_reconciled | 2026-07-31 | Builder shell / origin (CAP-85). Reaches CAP-86 only as the thin transport fronting this surface. | YES (out of this capability) |
| REQ-117 (`request-395b67e6`) | free_and_reconciled | 2026-07-31, merged `1741ee5d` | **Founding ask.** Edit-address contract in `site-schema/src/l1/edit.ts` (one resolution rule, module/slot scoping); `copyFieldsOf`/`applyCopyFields`; `1c copy get\|set`; one change map = one diff; the shared whole-definition validator; refusal carrying code/path/hint + envelope + exit status; empty field list as a legitimate answer; no raw HTML/CSS; long copy legible in full on reopen. ACs 1-8 (9-10 are the gesture, CAP-87). | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | 2026-07-31, merged `b2b9208c` | Image selection as the **second half of the same surface** — no `image set` command, no `/api/image` route. Descriptor `type` widened `'string'` → `'string' \| 'enum'`; image region exposes `src` (closed list, current handle always included) + `alt`; enum membership enforced server-side *before* the shared validator; a save re-renders **both** channels. ACs 1-6 (AC-7, the asset listing, → CAP-89/STORY-102). | YES |
| BUNDLE-16 (`bundle-15c1f647`) | free_and_reconciled | 2026-08-07 | Carrier only (REQ-117 + REQ-115 + REQ-44 at `1741ee5d`). | — (carrier) |
| REQ-128 (`request-de67e1a1`) | **bundled** | 2026-08-08 | Container segment's `backgroundImageUrl` in the phase-1 picker — same derivation, same enum control. | imminent (NOT yet enforced) |
| REQ-126 (`request-d9407f80`) | **bundled** | 2026-08-08 | L1 control surface API: declared schemas, error taxonomy, addressing contract, version. Capability assignment unsettled. | imminent (no AC impact today) |
| REQ-129 (`request-b1300473`) | **bundled** | 2026-08-09 | Verbatim `get_l1`/`set_l1` on the control surface; click-to-edit modal explicitly unchanged. | imminent (no AC impact today) |

No reconciled intent retires behaviour expressed by an earlier one. REQ-118 is
purely additive plus one clarification REQ-117 had left open — that an image
region is *not* a "nothing to edit" region — and AC-981 carries that
clarification correctly.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| AC-980 — copy region exposes one plain-text field, value character-exact | REQ-117 AC-2 | aligned (its multi-line sub-clause has no parent in the story body — W4 — and is restated in AC-990 — W3) |
| AC-981 — region exposing nothing returns an empty list and succeeds | REQ-117 AC-1, REQ-118 | aligned; correctly absorbs REQ-118's reclassification of image regions. See W5 (REQ-128 will narrow it) |
| AC-982 — saving words updates the draft and re-renders | REQ-117 AC-2 | aligned |
| AC-983 — one save is one change, never half-written | REQ-117 AC-3 | aligned (its one-diff claim is restated in AC-1026 — W2) |
| AC-984 — rejected edit leaves draft + render byte-identical | REQ-117 AC-4 | aligned |
| AC-985 — structured fault: code, path, hint, failing exit status | REQ-117 "the loop is closed" | aligned |
| AC-986 — whole-definition validation by the shared validator, both kinds | REQ-117 AC-5, REQ-118 AC-3 | aligned; asserted by *consequence* (identical code/message/path vs an unrelated structured-edit command), which is how both intents said it must be proved |
| AC-987 — malformed address refused outright, never coerced | REQ-117 | aligned |
| AC-988 — unknown field / non-text value / off-list choice refused | REQ-117, REQ-118 AC-5 | aligned; the "at the field, before the shared validator" rationale matches `edit.ts:294` |
| AC-989 — copy in a module's presentation slot, scoped by instance + slot | REQ-117 AC-7 | aligned; covers both slot shapes and the no-slot refusal |
| AC-990 — overflowing copy reads back in full | REQ-117 AC-8 | aligned **to intent**, but has no parent bullet in STORY-100's body — W4; multi-line-control clause duplicated from AC-980 — W3 |
| AC-991 — exactly two field shapes, neither can carry code | REQ-117 AC-6, REQ-118 §1 | aligned; states the enum shape is a *narrowing*, matching REQ-118's own argument |
| AC-992 — builder origin is the same surface, both kinds, both renderings | REQ-117 (origin half), REQ-118 (origin half) | aligned; load-bearing "no separate image route" claim lives here |
| AC-1024 — image region exposes closed-list `src` + `alt`, images only | REQ-118 AC-1 | aligned (origin clause duplicates AC-992 — W1) |
| AC-1025 — current handle always among its own options | REQ-118's "one non-obvious correctness detail" | aligned; verbatim rationale match with `imageChoices` (`edit.ts:189-203`) |
| AC-1026 — image save updates draft + re-renders; handle and alt in one diff | REQ-118 AC-2, AC-4 | aligned (origin clause — W1; one-diff clause — W2) |
| AC-1027 — bakes nothing; every other region parameter survives | REQ-118 AC-6 | aligned; protects the deferred framing-parameter home (DOC-28 §13 Q5) |

**Coverage sweep — every in-scope bullet of STORY-100's body has at least one AC:**

| Story body bullet | ACs |
|---|---|
| Naming a region of a page (strict form, malformed refused, one rule, instance+slot scoping) | AC-987, AC-989 |
| Asking what a region exposes (copy / image / nothing) | AC-980, AC-981, AC-1024, AC-1025 |
| Applying one change as one change | AC-983, AC-1026 |
| Validating the whole result, not the edit | AC-986 |
| Refusing legibly (byte-unchanged, structured fault, off-list refused at the field) | AC-984, AC-985, AC-988 |
| Making the change visible (re-render; both channels via the origin) | AC-982, AC-1026, AC-992 |
| Being incapable of raw code | AC-991 |
| Changing nothing but structured fields | AC-1027 |

No in-scope bullet is unaddressed. The reverse direction has one gap — AC-990's
subject matter, see W4.

**Code spot-checks** (to confirm the AC set describes a real surface, not an
aspirational one): `packages/site-schema/src/l1/edit.ts:138` (`type: 'string' |
'enum'`), `:196-203` (`imageChoices` adds the current handle), `:240-249`
(`src` enum + `required`, `alt` string with `widgetFor`), `:294-298` (enum
membership refused before the shared validator);
`tools/generate/src/cli/edit.ts:382` (`segmentOptions` narrows to
`imageHandles`, so AC-1024's "no font or stylesheet" is grounded), `:400`,
`:439-447` (single derivation, single refusal shape). `backgroundImageUrl`
appears nowhere in `edit.ts`, confirming REQ-128 has not landed.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | exclusivity | AC-1024 + AC-1026 vs AC-992 | ac-edit | AC-992 already owns origin parity for **both** region kinds ("the same single endpoint for a change of words and a change of image"). AC-1024 restates it ("Assert the same answer is returned when the region is read through the builder origin"); AC-1026 restates it twice ("Through the builder's origin, a saved choice leaves both the editable rendering and the plain draft rendering current" + "Repeat the save through the builder origin and assert both rendered channels on disk reflect it"). Carried unrepaired from REPORT-1614 F1. | Drop the origin clauses from AC-1024 and AC-1026; leave AC-992 sole owner. Do **not** narrow AC-992 to copy — see Notes. |
| 2 | warning | exclusivity | AC-983 + AC-1026 | ac-edit | AC-983 establishes the general rule ("applied as a single atomic change however many fields it names… a well-formed map results in exactly one modified page document"). AC-1026 restates its multi-field half for the image case ("A new image and a new alt text chosen together are **one change, not two**… a single operation producing a single diff"). Defensible as a REQ-118 AC-4 specialisation, but the one-diff claim is asserted in two places. Carried unrepaired from REPORT-1614 F2. | Reduce AC-1026's second paragraph to what AC-983 does not cover — that *both* fields are reported as changed — and let AC-983 own the atomicity claim. |
| 3 | warning | exclusivity | AC-980 + AC-990 | ac-edit | The "long or multi-line value asks for a multi-line control, a short one does not" rule is asserted in AC-980 (criterion *and* verification) and again in AC-990 ("together with a request for a control able to display it in full" / "assert… the multi-line control is requested"). AC-990's distinct core — overflowing copy is *accepted* and reads back character-for-character untruncated — is not duplicated. Carried unrepaired from REPORT-1614 F3. | Keep the multi-line-control rule in AC-980, which owns the descriptor shape; reduce AC-990 to the full-fidelity readback it uniquely covers. |
| 4 | warning | coverage | STORY-100 (`story-37a3921b`) body ← AC-980, AC-990 | story-body-edit | **New this cycle.** REQ-117 AC-8 asks that copy longer than its box remain legible in full on reopen; AC-990 asserts it and AC-980 asserts the multi-line-control rule that serves it. STORY-100's body contains **no** corresponding language — greps for `overflow`, `truncat`, `clip`, `legible`, `box`, `multi-line`, `textarea` all return zero hits across In scope, Out of scope and Technical Context. The ACs are correct and intent-grounded (`widgetFor`/`MULTILINE_AT` at `edit.ts:180-186`); the gap is upward, so this is not AC drift — but two ACs currently have no parent bullet. REPORT-1738 (story level) marked the body "aligned. All eight in-scope bullets trace" and did not catch this. | Add to STORY-100's "Asking what a region exposes" bullet (or as a ninth in-scope bullet): overflowing copy is accepted, reads back in full and never truncated or elided, and a long or multi-line value asks for a control able to display it whole. |
| 5 | warning | coverage | AC-981 | ac-edit (deferred) | REQ-128 (`request-de67e1a1`, **bundled** = imminent, 2026-08-08) asks that a container segment carrying `backgroundImageUrl` expose it in the same picker. AC-981 currently states the opposite as settled ("a layout container, a behavior-module instance" exposes nothing). Verified **not landed** on this branch — `backgroundImageUrl` is absent from `packages/site-schema/src/l1/edit.ts` — so this is imminent, not enforced. Mirrors REPORT-1738 F3 at the AC layer. | No edit until REQ-128 reconciles. On reconcile, AC-981 must narrow to a container with paint but **no** `backgroundImageUrl` (REQ-128 AC-7 deliberately preserves the empty-list answer for that case), and a new AC must cover the background handle in the picker. |
| 6 | info | consistency | CAP-86 body vs AC-991, AC-1024…AC-1027 | — (open at story level) | The capability body still reads "plain words and nothing else" and never mentions images, contradicting the five image/two-shape ACs. This is REPORT-1738 finding 1 (violation, story level, resolution `story-body-edit` on the capability body) and is **not repairable by an AC edit** — every AC is on the correct side of it. Recorded here so the AC level is not read as endorsing the stale body. | none at this level; tracked by REPORT-1738 |
| 7 | info | consistency | AC-980, AC-982, AC-1026, AC-1024 | — | Several ACs specify finer than the prose above them — the no-op "nothing changed" outcome on resubmitting identical values (AC-982, AC-1026), `required: true` and duplicate-free stable ordering on the image field (AC-1024). None contradicts the story body; specifying finer downward is the expected direction. | none |

## Notes for the Editor

- **Nothing at this level blocks the capability.** Zero violations, zero
  `needs_review`. The four actionable warnings are all subtraction or a
  one-sentence addition; none changes the behavioural surface the matrix
  describes.

- **Warnings 1-3 are the same shape and have now survived two cycles unrepaired.**
  REQ-118's ACs were authored as a self-contained set mirroring REQ-118's own
  seven ACs, rather than as deltas against the REQ-117 ACs already in the story
  — so three claims REQ-117's ACs already owned (origin parity, one-diff
  atomicity, the multi-line-control rule) each appear twice. The fix in every
  case is subtraction from the *newer* AC. They were reported identically in
  REPORT-1614 (2026-08-07) and the AC text is unchanged since, so the
  opportunistic repair has simply not been picked up.

- **Warning 1 has a direction that must not be reversed.** AC-992's value is
  that it asserts origin parity is *kind-agnostic* — one endpoint for words and
  for images. Trimming AC-992 to copy in order to resolve the overlap would
  delete "there is no separate image route", the load-bearing claim of REQ-118's
  "second half, not a second mechanism" framing. Trim AC-1024 and AC-1026.

- **Warning 4 needs a story-level editor, not an AC editor, and the story level
  has already reported.** REPORT-1738 explicitly cleared STORY-100's body as
  covering all eight in-scope bullets; the overflow guarantee is a ninth subject
  the AC set proves but the body never states. If the story-level fix pass is
  already scoped to REPORT-1738's three findings, this one will fall through the
  gap between the two levels unless it is added there deliberately.

- **The shared-validator claim remains well guarded.** AC-986 proves it by
  consequence — an unrelated pre-existing violation refuses a copy edit, an
  image edit and an unrelated structured-edit command with identical code,
  message and path — which is exactly how REQ-117 AC-5 and REQ-118 AC-3 said it
  must be proved. No AC weakens it to an inspection-style assertion.

- **Three `bundled` intents are inbound; only REQ-128 touches an AC today.**
  REQ-126 (control-surface formalisation: error taxonomy, addressing contract,
  version) covers the two contracts CAP-86 owns but spans all 16 `edit.ts`
  operations, so its capability home is unsettled — no AC action. REQ-129
  (verbatim `get_l1`/`set_l1`) gives the AI a write shape the operator does not
  have, which will need a deliberate re-reading of the story's "neither has a
  private route to the draft" claim when it reconciles — but it changes no AC
  now. Neither is recorded as a finding, because guessing their landing site is
  the drift this check exists to detect.
