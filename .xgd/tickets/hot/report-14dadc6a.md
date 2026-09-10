---
uid: report-14dadc6a
id: REPORT-3720
type: report
title: 'Fix Framework Substrate: L1 Layout, Values & Behavior Modules (story) — attempt
  7'
created_by: xgd
created_at: '2026-09-10T11:19:48.262181+00:00'
updated_at: '2026-09-10T11:19:48.262181+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-ae9d65d6
  level: story
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Framework Substrate: L1 Layout, Values & Behavior Modules (story)

**Attempt**: 7
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

All four violations and both warnings from REPORT-d6b1f43d were applied as one
coordinated pass, exactly as the "Notes for the Editor" section framed them:
findings 1–5 are REQ-93 and REQ-96 landing on the same two paragraphs plus
REQ-87's vocabulary, so STORY-82's contact-form paragraph, STORY-83's slot
sentence and STORY-85's in-scope list were edited together.

Every code citation in the report was **re-verified on this branch before
editing**, not taken on the report's authority:

| Claim | Verified at |
|---|---|
| `form` is the single required slot; `submit` is a control | `packages/framework/src/modules/contact-form/meta.ts:57-61, 66-68` |
| `labelMode` is a captured a11y fact, not a dial | `meta.ts:41-47` (the comment states it verbatim) |
| Renderer inserts the mounted fragment verbatim | `packages/framework/src/l1/render.ts:2150-2168` (`state.mounts?.[node.name] ?? ''`) |
| Page-level binding rule + five rejections | `packages/site-schema/src/schema.ts:568-620` |
| `mountInL1` conformance mode | `tools/generate/src/conformance/types.ts:85-92`, `harness.ts:92-141` |

## Actions Taken — by Resolution Category

| # | Category | Element | Finding | Action |
|---|---|---|---|---|
| 1 | story-body-edit | STORY-82 (`story-46e3b3c7`) | 1 | Repointed the contact-form paragraph to the **required `form` slot** carrying one `control` leaf per element (`field` per `config.fields` entry, optional `submit`), plus the invariant `label`/`honeypot`/`turnstile` that are never bound. `intro`/`submit` retained only as a named REQ-96 supersession sub-bullet (v3→v4, breaking contract change), with `meta.ts` cited as the live record. |
| 2 | story-body-edit | STORY-82 (`story-46e3b3c7`) | 2 | Deleted the "`fieldLabels=placeholder` is gone" clause. Replaced with `config.fields[].labelMode: 'visible' \| 'placeholder'`, framed as REQ-93 frames it — read from the reference's a11y-tree `nameSource`, a captured fact about the control's accessible name with the a11y tree as its only witness, not an aesthetic choice. Explicitly ties it to the story's own headline "compact placeholder-labelled contact form" promise, and preserves the accessibility obligation correctly: the accessible name is always emitted, only its presentation differs. |
| 3 | story-body-edit | STORY-82 (`story-46e3b3c7`) | 5 (warning) | Renamed throughout to post-REQ-87 vocabulary: "behavior module", "behavioural config", "behavior validators", and STORY-85 by number instead of "the Capability Modules story" (Story, Description, In/Out of scope, Technical Context, Dependencies). Added a Technical Context "Vocabulary" note recording REQ-87's rename and its no-back-compat-alias rule — the one remaining occurrence of the old term, and it is a historical citation rather than a use. |
| 4 | story-body-edit | STORY-83 (`story-d0a8cfad`) | 3 | Replaced the trailing Out-of-scope sentence asserting a slot has "no module code and no behaviour attached" with a new **"What a `slot` emits: placeholder, or a mounted fragment"** section. States the mount rather than restoring the false absolute: inert placeholder *when no mount is supplied*; the bound module's framework-rendered fragment when one is. Per the report's security note, the carve-out's reasoning is now on record as two named pre-conditions — (1) the content is framework-rendered markup whose instance values already passed the module's own escaping/URL sinks, (2) the binding was proved by the page validator before render — and the substrate's real invariant is restated in the form that survives: no value originating in *instance data* reaches the browser except through a typed sink. |
| 5 | story-body-edit | STORY-83 (`story-d0a8cfad`) | 6 (warning) | Corrected the "Merged from STORY-81" note. STORY-81 is stated as **live on this capability** with distinct REQ-104 behaviour (per-width layout track, wrapping row); what is archived is its *pre-REQ-104* state under CAP-68, which is the state the AC-717 reassignment note describes. A reader following the pointer now lands on a story the note says exists. |
| 6 | story-body-edit | STORY-85 (`story-179b8c06`) | 4 | Added a **"Where a behaviour sits on a page: it must name the seam it mounts into"** section immediately after the two-directional control check (where instance validation already lives, not appended at the bottom). Carries REQ-93's rule — `modules` and `l1` are not exclusive; each module must bind by name to a `slot` present in the tree — as a table of all six rejections (unbound module, dangling name, double-bound seam, orphan seam, `slot`-without-`l1`, duplicate slot names) with the reason each is an error, plus "both empty is legal". Adds `mountInL1` as the position a behaviour inherits its obligations in: same universal ACs against the mounted shape, keyframe at every probed width so the wrapper can never be what overflows. Closes the ownership loop with STORY-83 in both directions (this story owns the rule, STORY-83 owns the emission). Extended the **In scope** list to match. |

Provenance: `updated_by` set to `request-f26cbe32` (REQ-93) on all three stories —
it was `bundle-31e474b9` on STORY-82, the stale value the report used as evidence
that the previous six attempts never reached these bodies.

`uat_coverage` was **not** touched on any story: that field is owned by
`check_uat_coverage` / `fix_uat_coverage`, and setting it here would manufacture
progress this call did not make.

## Code Edits (if any)

None this call. All six mutations are ticket-body/field edits. No production
code was read-modified — the source files above were read only to verify the
report's citations before writing the story text.

## Verification

No tests run: nothing executable changed. Post-write integrity confirmed on all
three tickets (frontmatter intact, body round-trips, no truncation):
STORY-82 5,392 chars, STORY-83 49,675 chars (was 47,904), STORY-85 28,159 chars
(was 25,823). Scrub greps confirm STORY-82 carries no remaining *use* of
"capability module"/"capability config"/"capability validators" and no surviving
`intro`-slot claim, and STORY-83 no longer contains the negated renderer clause.

## needs_review Items Forwarded

None. Every finding cited a `free_and_reconciled` intent and was resolvable at
this level.

## Carried to the AC-level cycle (not actionable at level=story)

| Element | Note |
|---|---|
| CAP-70 AC tree | Finding 4 observed that **no AC anywhere in the matrix cites REQ-93**. The story-body half is now repaired on STORY-85, but the coverage half is an `ac-add` at level=ac — the page-level binding rejections and `mountInL1` have no acceptance criterion. Flagging so the AC cycle does not read the repaired story body as evidence the ACs exist. |
| STORY-82 (`story-46e3b3c7`) | Finding 8 (info) flagged STORY-82 as provenance rather than capability surface, with duplication likely to bite at its ACs. Unchanged by this pass, and correctly deferred. |
