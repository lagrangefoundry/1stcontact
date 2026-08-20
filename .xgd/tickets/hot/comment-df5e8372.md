---
uid: comment-df5e8372
id: COMMENT-1336
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T16:26:32.960028+00:00'
updated_at: '2026-08-20T16:26:32.960028+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-5769ecf8
  kind: note
---

Done — REPORT-2471 (`report-5769ecf8`) created. (The push warning is the sandbox's blocked network, not a ticket-store failure; the ticket was committed locally.)

**One mutation, matching the report's one violation:**

**AC-1327** (`acceptance_criterion-16093733`) — ac-edit. Bullets 1–3 and their three Verification sentences preserved verbatim. Bullet 4's freshness claim ("picked up on the next request, without the server being restarted") replaced with the store-shaped property the port actually contributes:

> The preview re-asks the store on each request; its memoised render is invalidated by the store's own stamp rather than held, so what is served follows the definition the store currently holds.

The Verification's final sentence now asserts stamp-change → re-render rather than a no-restart experiment, and a new paragraph hands the operator-visible freshness outcome back to CAP-85's AC-1033 by name, quoting STORY-118's own scoping sentence. I took the report's preferred re-scope over the minimal deletion, since the stamp is a real contribution of this port. CAP-85 was not touched.

I verified all three code citations from `origin/main` before editing (`preview.ts:6`, `:79-86`, `:100`) — this worktree's HEAD predates BUNDLE-19's merge, so the port modules aren't present locally.

**Sweep for the named pattern:** I read all eleven AC bodies in full and checked each against STORY-118's "Relationship to existing capabilities" paragraph and its three deliberate non-behaviours — the two places the report says the drift has been hiding. No further instances: AC-1323 self-limits away from atomicity, AC-1321's pending-files clause matches the no-revision-store non-behaviour, and nothing restates CAP-85's asset-name confinement. AC-1327 was the last one.

No code or test edits. Findings 2/3/4/6 are informational; finding 5 (missing `test_UAT_AC1353_*` / `test_UAT_AC1354_*`) is marked "none at this level" and can't be worked here anyway — the port modules are absent from this worktree. One item flows to the uat cycle: any existing AC-1327 UAT written to the old bullet 4 needs re-pointing at the cache-invalidation assertion.

`needs_more_work: false`, `progress_made: true`, `violations_remaining: 0` — over to the assessor.
