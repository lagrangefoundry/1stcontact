---
uid: report-dd3fa892
id: REPORT-2403
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (story) — attempt
  7'
created_by: xgd
created_at: '2026-08-20T07:46:09.947633+00:00'
updated_at: '2026-08-20T07:46:09.947633+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: story
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (story)

**Attempt**: 7
**Fixes applied this call**: 5 ticket mutations, resolving all 6 violations + 1 warning
**Violations remaining**: 0
**Needs more work**: false

All seven findings were `story-body-edit` and all had verifiable code anchors, so
they were resolved in one pass rather than chipped at. Every claim written into a
story body was checked against the cited file:line before writing.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-83 (`story-d0a8cfad`) | **Finding 2** — added the renderer's seam emission to the In-scope list: the `mounts` map on `renderL1Document` / `renderL1Fragment`, a bound seam emitting the module's pre-rendered fragment *inside the seam's own positioned box* (so a mount costs no wrapper), verbatim insertion justified by the fragment being framework-rendered markup rather than instance data, and per-instance class prefix namespacing as the collision guarantee |
| 2 | story-body-edit | STORY-83 | **Finding 3** — replaced the unconditional "a `slot` renders inert" claim with a bound/unbound split: an *unbound* seam renders the inert labelled placeholder; a *bound* seam renders the same `div`, same name/behavior attributes, same axes, carrying the mounted fragment. Added that leaving a seam unbound is legal, not an error. Also moved the sentence out of the Out-of-scope paragraph it had been stranded inside, and added the page composition rule to Out-of-scope with an explicit hand-off to STORY-85 |
| 3 | story-body-edit | STORY-83 | **Finding 7 (warning)** — dropped "now archived" from the "Merged from STORY-81" note and added a paragraph recording REQ-104's revival, with the scope split stated so the two are not confused: what merged here is per-viewport variation of *length* parameters; what STORY-81 owns today is per-width *layout mode* and row wrapping |
| 4 | story-body-edit | STORY-85 (`story-179b8c06`) | **Finding 1 (load-bearing)** — new "Where a behaviour sits on the page — the composition rule" section: the REQ-88 XOR narrowed to slot-bound mounting, the rule quoted, and a table of the rejection cases each with its reason. Added to the In-scope list. Also recorded that the seam inventory preserves document order and duplicates *precisely so* the ambiguous case is visible |
| 5 | story-body-edit | STORY-85 | **Finding 2 (conformance half)** — recorded the `mountInL1` fixture mode in Technical Context: conformance runs in both shipping shapes, a behaviour conforming standalone but not mounted is a real defect, and the host document's keyframe-at-every-width means an overflow under this mode is the behaviour's own. Extended the In-scope line accordingly, and sent the renderer's mount *emission* to STORY-83 in Out-of-scope ("this story stops at whether a binding is valid") so findings 2 and 1 do not double-own the seam |
| 6 | story-body-edit | STORY-82 (`story-46e3b3c7`) | **Findings 4, 5, 6** — rewrote the body wholesale against contact-form v4 rather than patching the three quoted sentences, per the report's editor note. See breakdown below |
| 7 | ac-deprecate (paired) | AC-718 (`acceptance_criterion-f3328e22`) | Durable `status: deprecated` set + lineage body, pairing with mutation 6 |

### Mutation 6 breakdown — STORY-82

- **Finding 4 (REQ-87 rename).** Every retired `Capability*` name replaced: "capability config" → behavioural `config`; "capability module" → **behavior module** (with REQ-87 named as the renaming intent and its no-back-compat-alias rule stated); "capability validators" → `validateBehaviorSlots` / `validateBehaviorInstance`; "the Capability Modules story" → STORY-85. Verified zero remaining occurrences of all four strings.
- **Finding 5 (REQ-96 slot deletion).** Repointed to the v4 surface: `intro`/`submit` deleted, one **required** `form` slot holding the entire L1 presentation, `control` leaves inside it (one `field` per `config.fields` entry, optional `submit` for the button), and the reason the slot is required (a form with no authored presentation has no visible controls — failing loudly beats an empty box). `submit` now appears in the body only as a deleted-slot historical note or as the `submit` **control** leaf.
- **Finding 6 (`labelMode`).** Removed `fieldLabels=placeholder` from the deleted-dials list and gave it its own paragraph: it survives as `config.fields[].labelMode: 'visible' | 'placeholder'`, behavioural because it records a *captured a11y fact* whose only witness is the a11y tree — not an aesthetic dial. Tied back to the story statement's promise of a "compact placeholder-labelled" form, which was the self-contradiction the finding identified.
- Also refreshed the Story statement (it still described the presentation surface as "capability config plus named L1 slots"), the Dependencies section, and Technical Context — the finding was drift across the whole body, and the ACs/dependencies restated it in three more places.

## Code Edits

None this call. No production code was touched; all seven findings were matrix
drift, which is the expected shape here — per CLAUDE.md's no-legacy-modes rule the
deleted surfaces (`Capability*`, `intro`/`submit`, inert-only slot render) leave no
trace in code, so the story bodies were the only place they still existed.

Code was read to ground every edit:

| Claim written | Verified at |
|---|---|
| `mounts` map, verbatim fragment in the seam's own box | `packages/framework/src/l1/render.ts:1816, 2105-2124, 2347, 2380` |
| binding rejection cases | `packages/site-schema/src/schema.ts:546-611` |
| duplicates preserved so ambiguity is visible | `packages/site-schema/src/l1/slots.ts` (`l1SlotNames`) |
| `mountInL1` binds to seam `mount` on an `l1HostDocument` with the full width ladder | `tools/generate/src/conformance/harness.ts:138-147` |
| v4 surface: `slots: { form: { required: true } }`, `field`/`submit` controls | `packages/framework/src/modules/contact-form/meta.ts:58-70` |
| `labelMode` is a captured a11y fact, not a dial | `packages/framework/src/modules/contact-form/meta.ts:41-49` |

## One correction to the validation report, for the assessor

Finding 1 lists **five** rejection cases, the fourth being "an orphan seam no
module binds". The code does not reject that case, and should not: `schema.ts`
computes the `bound` set but never diffs it against `available`, and an unbound
seam is exactly what finding 3 says renders as the inert placeholder. Treating it
as an error would contradict finding 3 and make an L1 tree unable to declare a
mount point the page has not filled.

STORY-85 was therefore written with the four module-side rejections plus the
duplicate-seam-name ambiguity (which `schema.ts:558-565` does reject, and which
finding 1 mentions separately), and STORY-83 states explicitly that an unbound
seam is legal. If the assessor intended a fifth rejection, that is a `code-issue`
against `schema.ts`, not a story edit — flagging rather than acting on it, since
the code and finding 3 agree with each other.

## Note on AC-718 (paired with mutation 6)

AC-718 pinned the REQ-85-era `intro`/`submit` slots and asserted
`fieldLabels=placeholder` was removed as an aesthetic dial — both contradicted by
the same intents as findings 5 and 6, so it could not stay `active` while
STORY-82's body was corrected without leaving the matrix inconsistent at this call
boundary.

A prior attempt had already decided to retire it but recorded that with
`fields.lifecycle: deprecated` — the invented field this prompt explicitly warns
about. It is not in the `acceptance_criterion` schema, nothing reads it, and the
AC's durable top-level `status` was still `pending`, so the retirement was
invisible to the matrix. Completed properly: `status: deprecated`,
`uat_coverage: deprecated`, and a lineage body citing REQ-96 (BUNDLE-11,
2026-08-06) for the slot deletion and REQ-93 for the `labelMode` reframe, with
the original criterion preserved below the marker. The stale `lifecycle` key was
left in place — removing it is a schema-hygiene question for the operator, not
this finding.

AC-719 (the L1-leaf-axis half) was read and is unaffected — `uat_coverage: pass`,
and its text describes the surviving surface correctly. STORY-82 retains it as a
live criterion.

## needs_review Items Forwarded

None. Every finding resolved against an intent whose status and asks were
unambiguous, and the report itself recorded zero `needs_review` items.

## Recorded for the next check, not raised as work

REQ-145 and REQ-148 are both `ready_to_reconcile` and will move this capability
again — REQ-148 changes the behavior-module contract itself (Astro deleted from
the module render path, `AstroComponentFactory` → `BehaviorComponent`), so STORY-85
should be expected to take a further upgrade shortly. Neither is a violation now;
no edit was made in anticipation of them.
