---
uid: report-028ea698
id: REPORT-1756
type: report
title: 'Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The
  Click-to-Edit Gesture (level=story)'
created_by: xgd
created_at: '2026-08-10T08:27:25.388033+00:00'
updated_at: '2026-08-10T08:27:25.388033+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-12fee326
  level: story
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

Two stories carry this capability: **STORY-98** (`story-af36c2cb`, upgrade — the
edit render channel) and **STORY-101** (`story-3bf94bd4`, feature — the
click-to-edit gesture). Both are aligned to the reconciled intent ledger. The one
warning is a traceability defect in a citation, not a behavioural gap.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability's tree.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-116 (`request-41796766`, via BUNDLE-14 `bundle-0385746c`) | free_and_reconciled | created 2026-07-31; merged `cd8f98c8` 2026-08-06 | The edit render: inert third channel, settled state, derived segmentation, render-scoped L1 addresses, renderer-drawn outlines. 9 ACs. Explicitly defers all UI/click handling to T3 | YES |
| REQ-117 (`request-395b67e6`, via BUNDLE-16 `bundle-15c1f647`) | free_and_reconciled | created 2026-07-31; merged `1741ee5d` 2026-08-07 | The edit gesture end-to-end (10 ACs). Also renderer-side: moved the stamp vocabulary to `site-schema`, added the `data-fc-page` page stamp, homed the hover rule in `L1_EDIT_CSS`, added `contact-form`'s seam marker | YES |
| REQ-117 free-coded follow-ups (`69f06debd` stale-render guard, `9fcba993c` fieldless-modal dismissal, `9fe83e746` + `fa124bf5a` origin freshness, `f8c3e45b8` nowrap width floor) | carried by REQ-117 | 2026-08-07 → 2026-08-08, all ancestors of this branch | Behaviour delivered under REQ-117's scope ticket but **never written into its body** — the ledger's thin spot (see finding 1) | YES |
| REQ-118 (`request-66e4c630`) | free_and_reconciled | created 2026-07-31; merged `b2b9208c` 2026-08-07 | Image selection through the *same* gesture: enum field shape, closed asset picker, current handle always an option. Retired the image as the worked example of "a region with nothing to edit" | YES |
| REQ-115 (`request-a6740b4a`, BUNDLE-16) | free_and_reconciled | 2026-08-07 | Builder workspace/chrome — **CAP-85 `capability-a994b8f3`**, referenced by both stories, owned by neither | YES (adjacent, out of scope here) |
| BUG-31, REQ-114 (BUNDLE-14), REQ-44 (BUNDLE-16) | free_and_reconciled | 2026-08-06/07 | Unrelated surfaces bundled alongside; REQ-116's code was swept into REQ-114's commit by a concurrent `git add -A` (provenance noted in STORY-98) | n/a to this capability |
| REQ-119 (`request-64864801`, BUNDLE-17 `bundle-e59210c5`) | **reconciling** | 2026-08-10 | Request-time draft/edit renders; **no artifact on disk**; save loses its render step | imminent |
| REQ-121 (`request-9707484c`, BUNDLE-17) | **reconciling** | 2026-08-10 | The copy-edit modal made elegant: themed chrome, app typeface, page-faithful editing box | imminent |
| REQ-128 (`request-de67e1a1`, BUNDLE-17) | **reconciling** | 2026-08-10 | A painted container's `backgroundImageUrl` joins the phase-1 picker — a container segment stops being a dead end | imminent |
| REQ-129 (BUNDLE-17) | **reconciling** | 2026-08-10 | L1 authoring on the control surface; states explicitly that the click-to-edit modal is **unchanged** | imminent (no-op here) |
| REQ-112 | abandoned | 2026-07-31 | — | NO |

**Enforcement boundary.** BUNDLE-17 carries `main_sha: null` on every commit — it
is not on `main`. The regression anchor (REPORT-1706, `50f23d80`) started
2026-08-09, before BUNDLE-17 existed (2026-08-10 07:12). The four imminent
intents are therefore recorded as ledger notes, **not** as coverage gaps: the
in-flight reconcile is the thing that will land them.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-98 `story-af36c2cb` (upgrade, `uat_coverage=pass`) | REQ-116 (origin), REQ-117 (update) | **aligned** — all 9 REQ-116 ACs are expressed across its 13 ACs; the four REQ-117 renderer-side additions (page stamp, hover rule, vocabulary move to `site-schema`, contact-form seam marker) are each present and attributed. Imminent note: REQ-119 |
| STORY-101 `story-3bf94bd4` (feature, `uat_coverage=pass`) | REQ-117 (origin), REQ-118 (update), REQ-117's free-coded follow-ups | **aligned** — REQ-117's 10 ACs and REQ-118's gesture-side scope are expressed across its 15 ACs, with the intent/code divergence declared. One imprecise citation (finding 1). Imminent notes: REQ-121, REQ-128 |
| Boundary with sibling capabilities | REQ-117, REQ-118 | **aligned** — no reconciled intent for this capability is orphaned, and nothing owned elsewhere is duplicated here (finding 8) |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | STORY-101 | story-body-edit | Technical Context states the *nothing to edit here* message was adopted as intended behaviour by "the later ticket sections". REQ-117 (`request-395b67e6`, free_and_reconciled) has no such section: its body's only statement on this is AC-1, "clicking a segment with no editable fields **opens nothing**", and REQ-118's body does not adopt it either. The adoption is real but lives elsewhere — free-coded commit `9fcba993c` ("*'Nothing to edit on this box segment yet' is a legitimate answer, not an error*", which also added the dismissal AC-1002 pins) and REQ-128 AC-7 ("a container segment carrying paint but no `backgroundImageUrl` **still reports nothing to edit**", reconciling). As written the divergence is declared but untraceable | Replace "The later ticket sections adopt the message as the intended behaviour" with the actual sources: commit `9fcba993c` under REQ-117, and REQ-128 AC-7 (imminent). Same paragraph: name `69f06debd` as the origin of AC-1003's stale-rendering guard |
| 2 | info | coverage | STORY-98 | — | REQ-119 (reconciling) deletes the on-disk artifact entirely — "channels render with no artifact on disk". STORY-98 says the channel lands "into its own output location". Correct on `main`; superseded the moment BUNDLE-17 reconciles | none now — revisit "own output location" during BUNDLE-17's reconcile |
| 3 | info | coverage | STORY-101 | — | REQ-128 (reconciling) gives a painted container carrying `backgroundImageUrl` a picker. STORY-101's worked example — "a region with nothing to edit is now the painted container" — narrows to containers *without* a background image (REQ-128 AC-7 preserves the dead end for those). AC-1001's example needs the same narrowing. REQ-121 likewise will restate the form's chrome | none now — revisit during BUNDLE-17's reconcile |
| 4 | info | consistency | STORY-98 | — | The story deliberately restates REQ-116 AC-8's "**byte-identical** before and after" as "the shipped channels carry no **edit-channel artefacts**", because REQ-117's `contact-form` seam marker is structural markup emitted in *every* channel and would falsify a literal byte-identity claim. The weakening is recorded in Technical Context with its reason; REQ-116 AC-8 was scoped "before and after **this ticket**", so it is not contradicted | none |
| 5 | info | consistency | STORY-98 | — | The story's "placement note (resolved)" — that the behavior-module contract story now carries the settled state as a **second declared carve-out** — is verified against STORY-85 (`story-179b8c06`): its body carries it, bounded to the edit channel by the document-level marker and to release-not-paint properties. The proposition/negation conflict the note describes is genuinely closed, and the two stories do not restate each other | none |
| 6 | info | exclusivity | STORY-98 + STORY-101 | — | Hover is split, not duplicated: STORY-98 AC-952 owns the *treatment* (renderer draws the strengthened outline, painted outside layout so no box moves); STORY-101 AC-993 owns *which* region is live. Both bodies state the split in the same words ("the gesture only says which region is live; the rendering says how live looks"). Not overlapping intent | none |
| 7 | info | coverage | STORY-101 (AC-1000) | — | "Closing a form in which nothing changed writes nothing" has no sentence of its own in REQ-117's body. It is the degenerate case of REQ-117 AC-3 ("one modal Save produces exactly one structured diff") under the `buffered` commit mode the ticket mandates, and its UAT drives the real origin and the real modal for both the confirm and the cancel route. Grounded, not drift — recorded here so a future check does not re-open it | none |
| 8 | info | coverage | capability boundary | — | Every reconciled behaviour from REQ-117/REQ-118 that is *not* here has a home: write path, validator, atomicity, refusal shape and enum membership → STORY-100 (`capability-f753cecd`); asset listing and `/api/assets` → STORY-102; workspace chrome, viewport fill (`94ae6fee`) and origin freshness (`9fe83e746`, `fa124bf5a`) → STORY-99 (`capability-a994b8f3`, "freshness over caching"); the nowrap width floor (`f8c3e45b8`) → STORY-83. No orphaned reconciled intent, no duplication | none |

## Notes for the Editor

**The one cross-cutting pattern is provenance, not behaviour.** REQ-117 delivered
five behaviours as free-coded follow-up commits that were never written back into
its ticket body — the stale-rendering guard, the fieldless-modal dismissal, the
two origin-freshness fixes and the nowrap width floor. The matrix picked all five
up correctly (three of them in this capability, two in CAP-85/L1), so nothing
drifted; but a reader who checks the story against REQ-117's body alone will find
three ACs apparently unsupported. Finding 1 is the visible tip of this. If the
editor wants a durable fix rather than a citation patch, the alternative is to
append the five commits to REQ-117's body under a "free-coded follow-ups" heading
— that repairs the ledger for every future check at once.

**Do not treat BUNDLE-17 as drift.** REQ-119, REQ-121, REQ-128 and REQ-129 all
change this capability's surface and all are `reconciling` with no `main_sha`.
Findings 2 and 3 name exactly what they will invalidate (STORY-98's "own output
location"; STORY-101's painted-container dead-end example and its form chrome) so
that reconcile has the list ready. Repairing them *now*, against a branch whose
code has none of it, would put the matrix ahead of the code — the same drift in
the other direction.

**One deliberate weakening is load-bearing and should survive editing.** STORY-98
replaced REQ-116 AC-8's byte-identity leakage test with an edit-channel-artefact
test (finding 4). It looks like a softened criterion; it is not. A future editor
tightening it back to byte-identity would make the matrix assert something the
`contact-form` seam marker falsifies by construction.
