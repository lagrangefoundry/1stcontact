---
uid: comment-3e560d2f
id: COMMENT-1337
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T16:31:36.466861+00:00'
updated_at: '2026-08-20T16:31:36.466861+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-18a88eb5
  kind: note
---

**REPORT-2472** (`report-18a88eb5`) — **FAIL**, 1 violation, 0 warnings, 0 needs_review.

## What I found

Fix attempt 4 did remove AC-1327's freshness sentence, but its replacement lands on the same side of the capability boundary — and I falsified the premise the last two reports built on.

REPORT-2470 recommended re-scoping AC-1327's bullet 4 onto the preview's memoised render, asserting "the `DraftSnapshot.stamp` that arrived with REQ-142 is what invalidates the memoised render." REPORT-2471 applied that wording and cited `origin/main:preview.ts:79-86`, `:100` as evidence.

`git show 2b902ead0^:tools/generate/src/cli/preview.ts` — the commit immediately before the port landed — shows all of it already present:

- `DraftSnapshot.stamp` at line 41 with the *identical* docstring ("Keys the render cache… picked up on the next request rather than needing the server restarted")
- The `PreviewRenderer` memoisation docstring **verbatim**, the same `cache` Map (line 120), the same `if (hit && hit.stamp === snapshot.stamp)` (line 172)
- `const snapshot = this.store.load(slug)` per request (line 135)

REQ-142 changed exactly two things: `DraftSnapshot.loaded: LoadedSite` → `result: LoadResult`, and the interface moved from `DraftStore` in `preview.ts` to `SiteStore` in `store/site-store.ts`. The cache, its invalidation policy and the per-request re-ask are REQ-119's — CAP-85. REQ-142's body never asks for any of it: `cache` appears once (the NUL-separator survey note), and `stamp`/`stale`/`fresh`/`memois`/`restart` appear zero times.

The exclusivity consequence is concrete: the new Verification sentence is CAP-85 **AC-1033**'s own experiment, and AC-1033 already carries `uat_coverage: pass`.

**Resolution: delete bullet 4 and the Verification's final sentence** — not a third re-scope. Deletion leaves no gap (bullets 1–3 plus AC-1354 carry the story's In-scope preview bullet), and the port's real contribution — `loadDraft` *answering* with a stamp — is already owned by AC-1321. The hand-off paragraph fix 4 added should stay, minus its last sentence, which repeats the misattribution in prose. CAP-85's AC-1033 must not be touched.

The other ten ACs check out: coverage over the In-scope list is complete, nothing crosses into Out-of-scope, both AC-1329 repairs hold, and AC-1324/AC-1325 remain complementary rather than duplicate. AC-1353/AC-1354 still lack AC-named UATs — a uat-level item, recorded as info.

Two operational notes: the report's git push failed (sandbox has no network) — the ticket is committed locally and will need a push from an unsandboxed context. And this worktree's HEAD predates BUNDLE-19's merge, so the port modules aren't present here; every citation was read from `origin/main` or the named historical commit, and I could not run the suite.
