---
uid: comment-9b724faf
id: COMMENT-2654
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-11T01:09:03.149069+00:00'
updated_at: '2026-09-11T01:09:03.149069+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-b47a698d
  kind: note
---

Both actionable findings from REPORT-c70b5618 are resolved in STORY-105 (`story-93905de4`), applied as one `xgd ticket update` carrying `--fields` and `--body-file` together.

**Finding 1 (violation, consistency)** — the Divergences bullet claimed the surface grew "because later work **in this same bundle** extended the same declaration." Rewritten to name the actual extending intents: within BUNDLE-17, REQ-129 (the `get_copy`/`set_copy` → `get_l1`/`set_l1` retirement and `WriteCopy` → `AuthorPages` rename) and REQ-130 (five operations, `DrawImages` split from `ManageAssets` so it can be withheld — where that bundle closed); then **BUNDLE-19** (`bundle-77b28def`) with REQ-133 (`get_palette` into `ReadSite` plus the new four-write `ManagePalette` group, granted, read separable from writes) and REQ-131 (`list_changes` into `ReadSite` as an untrusted read with its own sequence entry). The count-independence sentence is preserved verbatim, as the finding directs. `fields.updated_by` now records `bundle-77b28def` alongside `bundle-b3b7c399`.

**Finding 2 (warning, consistency)** — Dependencies said "None." while Technical Context said "Depends on CAP-86." Dependencies now carries CAP-86 (`story-37a3921b`, the validated atomic write path) and `capability-c4c7a854` (the audit's storage), both qualified as already built rather than outstanding; the consumer note is kept as a trailing sentence.

I also added a Technical Context bullet recording the assessor's "pattern worth watching" — that REQ-131 and REQ-133 landed operations here while filed under the capabilities owning the *reach* — stating the rule that anything extending the declaration belongs in `updated_by` even when no criterion moves. That's aimed at REQ-157/158/160, which are draft today and extend this same declaration.

Every factual claim the rewrite asserts was re-checked against the tree at HEAD rather than taken from the report: `l1-surface.json` carries 27 operations at `surface_version: 4` across 9 groups; `ManagePalette` holds exactly the four palette writes with `get_palette` in `ReadSite`; `list_changes` is `effect: read` with `returns.provenance: "untrusted"`; and `instances.json` grants `caretaker` ManagePalette while withholding `ManageAssets` and `Publish`. No code or tests were touched — this was a citation repair.

Findings 3 and 5 were `info` with resolution "none" and left alone, with the reasoning recorded so a later check doesn't re-open finding 3 as drift. Finding 4 is forwarded: AC-1411 (`acceptance_criterion-cb6e1b58`) is the only one of STORY-105's 14 ACs at `status: pending` with `uat_coverage` unset, while the story and capability both read `pass` — that field is owned by the uat-coverage cycles, so I deliberately did not set it.

Completion report: **REPORT-3835** (`report-b47a698d`) — `fixes_applied: 4`, `progress_made: true`, `needs_more_work: false`, `violations_remaining: 0`.
