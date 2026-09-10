---
uid: comment-794b5e9a
id: COMMENT-2512
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T10:11:06.365425+00:00'
updated_at: '2026-09-10T10:11:06.365425+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-9c834330
  kind: note
---

**PASS** — `report-9c834330` (REPORT-3713). Violations 0, warnings 1, needs_review 0.

## What I checked

**Coverage** — re-derived the STORY-99 body bullet by bullet against all 36 active ACs (no archived/deprecated ones exist for this story). Every behavioral claim in the body maps to at least one AC. I also checked the inverse: the five things STORY-99's Reconciliation Decisions rule *out* of the matrix (the 501-shaped deferral, the deleted proxy, a deploy-time account seed, the interim production `INSERT`, BUG-37's assembled-definition memo) are asserted by no AC.

**The prior violation and both warnings are genuinely repaired** — verified against the code, not against `report-c47daafa`'s claim:
- AC-978 now enumerates the rendered channels plus the built-artifact tree's three prefixes, matching `router.ts:45-46` and the single `resolveStaticFile` over one root at `builder.ts:148-168,181-185`. Identical-outcome clause kept and re-pointed.
- AC-964 carries the deferral to AC-1400; AC-972 narrowed to the invocation half with serving deferred to AC-1035; AC-1036's deferral text no longer inherits the stale "all three trees". A sweep of all 36 bodies for the old phrasings returns zero hits.

**One new warning (does not gate).** AC-962 opens *"When the workspace is **started** on a machine where one of the shared UI components has not been installed…"*. Component resolution moved to build time under REQ-145 — the single resolution point is `webui.ts:205-220`, whose only production callers are the `1c assets` build and `shared-store.ts:62`. Starting an unbuilt tree produces the *other* diagnostic (`builder.ts:153-157`'s 503, which is AC-1400's). The asserted outcome and the Verification are correct; only the sentence saying *when* is stale. Fix is one clause in place — explicitly **not** a parallel build-time criterion, which STORY-99 rules out.

I also closed out the sweep the last report asked for: all 22 ACs still stamped 2026-08-16 were re-read against the serving code. AC-962 is the only hit; AC-961, AC-963, AC-979 and AC-1030 are correct as written.

Two items stay carried forward as `uat-edit`s, not counted here: AC-978's evidence has no `/framework/` traversal probe group, and AC-964's unadmitted probe never runs against a build artifact. Separately, the whole 2026-08-31 batch (AC-1399…AC-1403, AC-1449) has `uat_coverage` unset — that field belongs to the uat cycle, so I left it alone, but an unset value isn't the same signal as a failing one and the capability currently reads `fail`.
