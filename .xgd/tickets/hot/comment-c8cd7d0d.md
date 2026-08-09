---
uid: comment-c8cd7d0d
id: COMMENT-857
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:09:27.211158+00:00'
updated_at: '2026-08-09T01:09:27.211158+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1681026a
  kind: note
---

`result: 'pass'` is present in `frontmatter` — my earlier read looked at the wrong nesting level. Everything is stored correctly.

## Cluster 2 resolved — all three stories **confirmed**, no ticket changes

**Decision: the overlap is acceptable.** The survey read two serving surfaces; there are actually **three**, each with a distinct audience and trust boundary:

| Surface | Implementation | Owner |
|---|---|---|
| Public delivery Worker | `apps/public-site/src/` (own routes, content-type, site-store) | CAP-82 / STORY-95 |
| Standalone local preview server | `tools/generate/src/cli/serve.ts` | CAP-82 / STORY-96 (local half) |
| Builder workspace origin | `tools/generate/src/cli/builder.ts` | CAP-85 / STORY-99 |

The obligations that looked duplicated are **opposite or disjoint** on inspection:

- **Caching is contradictory by design.** Public delivery is cacheable — `max-age=31536000, immutable` / `max-age=60` (`public-site/src/index.ts:24,33`; AC-909, AC-911). The workspace origin is `no-store, must-revalidate` on every response (`serve.ts:110`; AC-977), because it rewrites its bytes under the browser. Merging the capabilities would force one policy onto two surfaces needing opposite ones.
- **Confinement guards different threats** — a multi-tenant address grammar plus a server-fixed servable store tree (AC-907, AC-927) vs. filesystem clamping across three local trees (AC-978).
- **Content typing is claimed only by CAP-82** (AC-908, AC-920); CAP-85 has no such criterion.

No AC pair across the two capabilities asserts the same behaviour — nothing to merge, nothing misfiled. STORY-96 in particular *must* stay in CAP-82: its deliverable is the two-sided preview↔production *agreement*, named verbatim in CAP-82's scope, and the two halves are genuinely independent implementations (`serve.ts:81`, `routes.ts:102`).

**One real code-sharing crossing, already documented:** `builder.ts:11` imports `NO_STORE`, `resolveStaticFile`, `sendFile` from `serve.ts` — deliberate, per the resolver's own comment ("one implementation, so a traversal guard can never be present on one tree and missing on another"). Two behaviours leak across as *inherited but unclaimed*: freshness (STORY-99 already records this under "Divergence flagged, not absorbed" and declines to claim it) and the clean-URL mapping (STORY-96's ACs scope themselves to "In local preview" / "On the deployed site"; neither story claims the workspace origin). Shared implementation crosses the line while the claims stay on their own side — boundaries working as intended, not ambiguous ownership.

**Verification:** all three `capability_uid` values unchanged and confirmed by re-read; AC counts intact (STORY-96 = 9, STORY-95 = 14, STORY-99 = 23); no merges, so no AC relationships disturbed and no test renaming needed.

**Report:** `REPORT-1711` (`report-1681026a`) — `report_kind=overlap_resolution`, `subject_uid=report-69e94af9`, `cluster_id="2"` (string, verified), `result=pass`.
