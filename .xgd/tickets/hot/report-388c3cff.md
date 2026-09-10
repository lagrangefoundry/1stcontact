---
uid: report-388c3cff
id: REPORT-3812
type: report
title: 'Fix In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
  (story) — attempt 5'
created_by: xgd
created_at: '2026-09-10T23:00:01.398461+00:00'
updated_at: '2026-09-10T23:00:01.398461+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: story
  fixes_applied: 7
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture (story)

**Attempt**: 5
**Fixes applied this call**: 7 passage edits across 2 story-body updates
**Violations remaining**: 0
**Needs more work**: false

Both violations and both warnings from report-4c3e67c5 were `story-body-edit`,
and both stories' bodies had never actually been touched in this regression
cycle (the report says so explicitly). They have now been rewritten and the
writes verified: STORY-98 and STORY-101 both read `last_field_updated: body`,
`updated_at: 2026-09-10T22:59Z`.

No AC was added, edited or deprecated — the report's "Notes for the Editor"
rules that out for both findings, and nothing in either edit changes what any
existing AC asserts.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-101 (`story-3bf94bd4`) | **Finding 1 (violation).** Out-of-scope paragraph: replaced the blanket exclusion of image **framing** ("crop, scale, scrim, rotation, edge effects and free positioning") with REQ-136's own *Phase 2 — still open* list — zoom / true source-rect crop, tint or scrim over an `<img>`, framing of a painted surface's own background image, drag-driven crop handles — keeping asset upload and image processing excluded. Crop-pan, scale, rotation and shape/corner-rounding are no longer denied |
| 2 | story-body-edit | STORY-101 | **Finding 3 (warning), passage 1.** In-scope "A form over that region's fields": an image region now exposes its picker and alt text **and "how the picture is seen"** — the framing, shape and colour adjustment the write path offers. Phrased as what the region exposes, not as a closed enumeration (per REQ-136's own supersession precedent) |
| 3 | story-body-edit | STORY-101 | **Finding 3, passage 2.** Same bullet's kind-agnosticism arrival list extended: image selection → typography → colour → "a picture's framing and adjustment with nothing here changed at all" |
| 4 | story-body-edit | STORY-101 | **Finding 3, passage 3.** "A dialog that composes several controls and still saves once": now "an image region's picker, its alt text and the parameters that say how the picture is framed, shaped and adjusted sit in one dialog" |
| 5 | story-body-edit | STORY-101 | **Finding 3, passage 4.** Technical Context: "Kind-agnosticism proved **three** times" → **four**, with framing named as the strongest instance (a region kind that exposed two fields gaining thirteen parameters, reached through the existing non-string split with no client change) |
| 6 | story-body-edit | STORY-98 (`story-af36c2cb`) | **Finding 2 (violation).** Out-of-scope non-goal restated from "Serving the edit render over the public web. It is a local render channel; the published and preview channels remain the only shipped ones" to what is still true post-REQ-145 / REQ-147: the edit channel is never published and never reaches a site visitor, and is reachable only through the operator-gated builder origin, which renders it per request. "Local render channel" and "the only shipped ones" are gone |
| 7 | story-body-edit | STORY-98 | **Finding 4 (warning).** In-scope "A third channel" now leads with the channel being a render **mode** that never publishes, is never content-addressed and never enters revision history; the output-location claim is **preserved** ("where it is materialised it lands in its own output location") because AC-958 rests on it and `1c render --edit` still behaves that way, with the per-request path added beside it |

## Evidence Checked Before Editing

| Claim | Verified at |
|---|---|
| The deployed Worker serves the edit channel | `apps/control-app/src/router.ts:68` — `const PREVIEW_CHANNELS: PreviewChannel[] = ['draft', 'edit']`, gated again at `:596` |
| Framing/shape/scale are offered on the image region today | `packages/site-schema/src/l1/edit.ts:833-851` — Fill mode, Pan across/down (%), Shape, Corner rounding (px), Rotate (°), Scale (%) |
| What is genuinely still out of scope | REQ-136 (`request-8a132869`) body, `# Phase 2 — still open` — zoom/true crop, tint over an `<img>`, background-surface framing, drag-driven handles |
| The CLI output location still exists | REQ-145 AC1 wording plus the retained `1c render --edit` path; claim kept rather than deleted |

Each of the 7 replacements was applied by exact string match with a
uniqueness assertion (1 match required, else abort), so nothing outside the
named passages changed. A unified diff of old-vs-new body was inspected before
either write, and line wrapping was matched to the surrounding prose.

## Code Edits (if any)

None this call. Both findings are consistency drift in story prose; the
behaviour they deny is already delivered and tested.

## needs_review Items Forwarded

None. Findings 5 and 6 are `info` with resolution category "—" (the
STORY-98 ↔ STORY-101 split is clean; superseded CAP-84 holds zero stories) and
require no mutation.

## Note for the Assessor

`fields.uat_coverage` was deliberately left as-is on both stories (STORY-98
`pass`, STORY-101 `stale`) — that field is owned by check/fix_uat_coverage, and
neither edit changes what any UAT proves.
