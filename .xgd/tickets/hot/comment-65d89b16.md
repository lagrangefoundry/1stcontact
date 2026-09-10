---
uid: comment-65d89b16
id: COMMENT-2519
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T11:20:04.535592+00:00'
updated_at: '2026-09-10T11:20:04.535592+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-14dadc6a
  kind: note
---

Done — attempt 7 applied all four violations and both warnings in one coordinated pass. **REPORT-3720** (`report-14dadc6a`), `needs_more_work: false`, `progress_made: true`.

**What changed (6 mutations across 3 stories):**

| Story | Findings | Edit |
|---|---|---|
| STORY-82 | 1, 2, 5 | Contact-form paragraph repointed to the required `form` slot + `control` leaves (`intro`/`submit` kept only as a named REQ-96 supersession); `fieldLabels=placeholder` "is gone" replaced by `config.fields[].labelMode` framed as a captured a11y fact; REQ-87 vocabulary applied throughout |
| STORY-83 | 3, 6 | New "What a `slot` emits" section stating the REQ-93 mount and the two pre-conditions the unescaped insertion rests on; merge note corrected to say STORY-81 is live and only its *pre-REQ-104* state was archived |
| STORY-85 | 4 | New page-level binding section (all six rejections as a table) + `mountInL1`, placed with the existing instance-validation content; In-scope list extended |

**On finding 3's security dimension** — I stated the boundary rather than restoring the false absolute, as the report asked. The substrate's invariant is now written in the form that actually survives: no value *originating in instance data* reaches the browser except through a typed sink. The mount is a framework→framework seam, sound for the two reasons now on record.

I re-verified every code citation on this branch before writing rather than trusting the report: `meta.ts:57-68` (the `form` slot and `submit` control), `meta.ts:41-47` (`labelMode`), `render.ts:2150-2168` (`state.mounts`), `schema.ts:568-620` (the rejections), `conformance/harness.ts:92-141` (`mountInL1`). All five held.

Two things I deliberately did not do. `uat_coverage` stays untouched on all three stories — that field belongs to the UAT-coverage check/fix pair, and setting it here would fake progress this call didn't make. And finding 4's *coverage* half is still open: the story body now describes REQ-93, but no AC in the matrix cites it, which is an `ac-add` at level=ac. I flagged that in the report so the AC cycle doesn't mistake the repaired story body for evidence the criteria exist.

No code changed and nothing executable was affected, so no tests were run; I verified the three tickets instead — frontmatter intact, bodies round-trip, no truncation (STORY-83 grew 47,904→49,675 chars, STORY-85 25,823→28,159), and scrub greps confirm the retired vocabulary and the negated renderer clause are gone.
