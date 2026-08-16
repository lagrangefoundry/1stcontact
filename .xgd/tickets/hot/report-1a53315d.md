---
uid: report-1a53315d
id: REPORT-2060
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=story)'
created_by: xgd
created_at: '2026-08-16T03:50:03.373538+00:00'
updated_at: '2026-08-16T03:50:03.373538+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: story
  violations: 3
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: story

**Result**: FAIL
**Violations**: 3
**Warnings**: 3
**Needs review**: 0

All three violations sit on **STORY-101** and share one shape: the body records
behaviour as *absent or out of scope* that a `free_and_reconciled` intent has
since delivered through this very gesture. STORY-98 is aligned.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability. `intent_uid` /
`updated_by` on the two stories record only four of these (BUNDLE-16, BUNDLE-14,
REQ-138, REQ-136); the rest were recovered from the story bodies and the ticket
store, because ACs under this capability carry no intent chain of their own.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-119 | free_and_reconciled | 2026-07-31 | Request-time draft + edit renders; the on-disk artifact and the save-time render step go away | YES (owned by STORY-99 / CAP-85) |
| REQ-116 (BUNDLE-14) | free_and_reconciled | 2026-08-06 | The edit render: non-functional channel, derived segments, L1 addresses, outlines | YES |
| BUG-31, REQ-114 (BUNDLE-14) | free_and_reconciled | 2026-08-06 | Sandbox R2 keyspace; L1 palette colour model — neither touches this capability | YES (other caps) |
| REQ-117 (BUNDLE-16) | free_and_reconciled | 2026-08-07 | Copy editing end-to-end: click segment → fields modal → validated diff → re-render | YES |
| REQ-115, REQ-44 (BUNDLE-16) | free_and_reconciled | 2026-08-07 | Builder shell; tooling hygiene | YES (other caps) |
| REQ-118 | free_and_reconciled | — | Image selection through the same loop, no second mechanism | YES |
| REQ-121 | free_and_reconciled | — | The copy-edit modal made elegant: themed chrome, page-faithful editing box | YES |
| REQ-128 | free_and_reconciled | — | Background image selection via the same picker | YES |
| REQ-132 | free_and_reconciled | — | Picker becomes a thumbnail grid labelled with file names | YES |
| REQ-135 | free_and_reconciled | — | Text properties: size, weight, italic on the segment (colour deferred to Phase B) | YES |
| REQ-136 | free_and_reconciled | 2026-08-12 | Image framing, shape and colour adjustment in the property sheet; **explicitly supersedes "an image segment exposes exactly src + alt"**; asserts edit/page paint parity | YES |
| REQ-138 | free_and_reconciled | 2026-08-12 | Live preview: **four** parameters (size, weight, italic, capitalisation) restyle the words as each is confirmed | YES |
| BUG-34 | bundled | 2026-08-12 | Gradient-filled text previews as invisible in the copy modal | imminent |
| REQ-139 | ready_to_reconcile | 2026-08-12 | Controls that cannot faithfully express what the element holds are shown **locked with the reason**, never hidden | imminent |
| BUG-35 | ready_to_reconcile | 2026-08-13 | Capitalisation and letter-spacing reach the words — `.builder-modal__box .fields-control` re-declares the inheritance the UA reset broke | imminent (**fix is merged into main**) |
| REQ-140 | ready_to_reconcile | 2026-08-15 | Text colour and panel background from the palette (REQ-135 Phase B) | imminent |
| REQ-134 | abandoned | — | Image generation component | NO |

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 (`story-af36c2cb`) | REQ-116, REQ-136 (parity assertion) | **aligned** — every REQ-116 ask (third channel, deliberate inertness, settled state, derived segmentation, addresses, page stamp, seam marking, renderer-drawn outlines + hover, one published vocabulary, no leakage) is expressed; REQ-136's paint-parity assertion is carried and correctly framed as a consequence of the one-emitter construction |
| STORY-101 (`story-3bf94bd4`) | REQ-117, REQ-118, REQ-121, REQ-128, REQ-132, REQ-135, REQ-138 | **3 violations** — the loop, the picker grid, the two-halves dialog, the one-Save-one-change rule and the live preview are all expressed; REQ-136's delivery and REQ-138's fourth parameter are not (F1–F3) |
| STORY-101 | REQ-139, REQ-140, BUG-34, BUG-35 (imminent) | flagged — see W1, W3; these reconcile into the matrix later and are not enforced now |
| STORY-101 | REQ-119 | stale rationale — see W2 |
| STORY-98 + STORY-101 | — | **no exclusivity issue**: the split is explicit and clean — the render owns *what a hot segment looks like*, the gesture owns *which segment is hot*; both bodies state it in the same terms |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | consistency | STORY-101 | story-body-edit | Body claims capitalisation never reaches the words: *"**Capitalisation is written like the others and does not arrive**"*, and Technical Context states *"the covering criterion claims three parameters rather than four, and the covering test asserts BOTH halves, that the property is set and **that the words do not change**"*. REQ-138 (free_and_reconciled) names four parameters. BUG-35's fix is **merged into main** — `apps/control-app/src/builder/builder.css:281-284` declares `.builder-modal__box .fields-control { text-transform: inherit; letter-spacing: inherit }` — and the covering test asserts the opposite of what the story says it asserts: `tests/reconciliation-copy-edit-live-preview.test.ts:515` reads `expect((await shown()).transform, 'and reaches the words').toBe('uppercase')` | Rewrite "The box follows the sheet" so **all four** parameters reach the words; delete the "Capitalisation is written and does not arrive" Technical Context paragraph and the recorded-divergence framing |
| 2 | violation | consistency | STORY-101 | story-body-edit | Out-of-scope list excludes *"image **framing** — crop, scale, scrim, rotation, edge effects and free positioning"*. REQ-136 (free_and_reconciled, 2026-08-12) delivered **scale, rotation, edge effects and free positioning** into this dialog's parameter sheet — `packages/site-schema/src/l1/edit.ts:586-604` derives Fill mode, Pan across/down, Corner rounding, Rotate, Scale, and `:551-552` the colour adjustments. Only **crop** and **scrim** remain out of scope (REQ-136 Phase 2), alongside asset upload and image processing which correctly stay out | Narrow the exclusion to *crop (true source-rect zoom), scrim/tint, background-surface framing, asset upload and any image processing*; move scale, rotation, shape/edge effects and free positioning into scope |
| 3 | violation | consistency | STORY-101 | story-body-edit | Body describes an image region as exposing only the picker and alt text — *"an image region exposes **which image goes here** … alongside its alt text"*, reinforced by *"an image region's picker and its alt text sit in one dialog"*. REQ-136 explicitly supersedes this: *"Five existing suites pinned the image segment's field list as exactly `['src','alt']`. REQ-136 changes that deliberately (an **intent conflict**, not an implementation one)"*. An image region now exposes the pair **first, in that order**, followed by a thirteen-control property sheet | State that an image region leads with picker + alt (order load-bearing, the dialog opens into the picker) and then exposes how the picture is seen in the parameter sheet |
| 4 | warning | coverage | STORY-101 | story-body-edit | REQ-139 (ready_to_reconcile) requires a control that cannot faithfully express what the element holds to be shown **locked with the reason**, never hidden, in this dialog (`annotateLocks` in `editor.js`, `.is-locked` / `.builder-lock` in `builder.css`). No bullet in STORY-101 expresses it. Confirmed **not yet landed** — `GLYPH_GRADIENT_LOCK` and `annotateLocks` are absent from the branch — so this is an imminent gap, not enforced now | Add on REQ-139's reconciliation; no action required at this level today |
| 5 | warning | consistency | STORY-101 | story-body-edit | Technical Context justifies the stale-rendering criterion with *"stale renderings recur by construction **until request-time rendering replaces on-disk renderings**"*. REQ-119 (free_and_reconciled) already met that condition for the builder — STORY-99 (CAP-85) records *"The staleness rule went with the artifact … That step is gone"*. The criterion itself still stands, because `1c render --edit` continues to write to disk (`tools/generate/src/cli/commands.ts:145`), but the rationale reads as forward-looking about work already done | Re-base the rationale on the surviving trigger — CLI-produced on-disk renderings — rather than on request-time rendering being a future event |
| 6 | warning | coverage | STORY-101 | story-body-edit | REQ-140 (ready_to_reconcile) moves a run's **colour** and the **panel background** from STORY-101's declared non-goals into scope. Body currently lists both under *"the palette control those need is a later phase"* | Update on REQ-140's reconciliation; correct as written today |

## Notes for the Editor

- **One root cause behind all three violations.** REQ-136 and REQ-138 both landed
  on 2026-08-12, and the `updated_by` chain shows why the body drifted: REQ-136
  updated **STORY-98** (the paint-parity bullet) and **STORY-100** (CAP-86, which
  carries the whole of *"how a picture is framed, shaped and colour-adjusted"*),
  but never STORY-101. REQ-138 then updated STORY-101 on 2026-08-13 for the live
  preview alone. So the gesture story is the only element in the tree that still
  describes the pre-REQ-136 world, and CAP-86's STORY-100 currently holds the
  negation of CAP-87's STORY-101 on the same subject.

- **Violation 1 cascades to the AC level and should be repaired together.**
  AC-1138 carries the identical stale claim in both its title — *"**Size, weight
  and italic** restyle the words"* — and its body — *"Capitalisation is written
  but does not arrive, and that is a recorded divergence … REQ-138 names four
  parameters and this criterion claims three."* The `ac`-level cycle takes the
  story body as its working reference, so repairing the story without AC-1138
  will simply re-derive the drift.

- **This is very likely the cause of `uat_coverage: fail` on the capability.**
  The story and AC assert that the words do *not* change; the test that covers
  them asserts that they *do*, and the code makes the test's version true. Worth
  confirming that the failing evidence is this pair and not a second, unrelated
  break before the fix loop runs.

- **Nothing to escalate.** The intent ledger is unambiguous on every finding —
  each violation cites a `free_and_reconciled` intent whose delivered behaviour
  is verifiable in the branch, so no `needs_review` was raised.

- **Out-of-scope observation (CAP-85, recorded not actioned):** STORY-99's body
  still refers the editable render to **CAP-84**, which is `superseded` — this
  capability (CAP-87) absorbed it. A cross-reference for whoever next runs the
  CAP-85 cycle.
