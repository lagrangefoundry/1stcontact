---
uid: comment-a162ee7d
id: COMMENT-2511
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T10:03:36.313271+00:00'
updated_at: '2026-09-10T10:03:36.313271+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c47daafa
  kind: note
---

Attempt 5 complete. Four ticket mutations, report `report-c47daafa`.

**The violation (finding 1, AC-978)** — I re-read the code rather than trusting the report. `router.ts:45-47`, `assets.ts:34-36` and `builder.ts:148-168` confirm both halves: `/framework/*.js` is a served class AC-978 named nowhere, and `/builder`/`/webui` are prefixes of one directory resolved at a single `resolveStaticFile` point, not two trees. Rewrote the enumeration to **the rendered channels** + **the built-artifact tree** with its three prefixes named, `/framework/*.js` explicitly, since it carries the edit client. Per the report's warning, I kept the identical-outcome clause and re-pointed it at prefixes rather than deleting it — that clause is the criterion's reason to exist. Verification gained a `/framework/` traversal probe; title retitled off "on every tree".

**Both warnings, taken in the same pass** as the Notes recommended:
- **AC-964** — added a deferral to AC-1400 in the shape the AC-1036 repair demonstrated. AC-1400 untouched.
- **AC-972** — narrowed to invocation + revision; the serving clause deferred to AC-1035 by name, citing STORY-99's out-of-scope line. Title lost "and the published result is served".

**Carry-through** the report flagged in finding 5: AC-1036's deferral sentence had inherited AC-978's stale "all three trees". A sweep of all 36 ACs afterwards found zero remaining hits for that phrasing — the matrix no longer contradicts itself on what is served. I also acted on the report's suggestion to check other 2026-08-16-stamped ACs: 24 of them share that stamp, but none other describes served-route topology in a way REQ-145 invalidated.

Two things I did **not** fix, both flagged rather than silently absorbed:

- AC-978's evidence test (`reconciliation-builder-workspace-origin.test.ts:202-235`) has no `/framework/` probe group, which the rewritten criterion now requires. I left `uat_coverage` at `pass` — that field belongs to check/fix_uat_coverage, and setting it here would be one cycle writing another's field — but recorded it prominently so the uat pass picks it up instead of inheriting a stale pass.
- AC-964's unadmitted probe still runs against `/preview/...` only, never an artifact, contrary to its Verification. Independent of my edit; the report already scoped it to the uat cycle.

No code or test files changed, so no test run was warranted; the evidence test is byte-unchanged. Declared `needs_more_work: false`, `progress_made: true` for the assessor.
