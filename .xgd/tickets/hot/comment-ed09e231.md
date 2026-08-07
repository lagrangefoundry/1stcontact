---
uid: comment-ed09e231
id: COMMENT-761
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T16:15:43.758765+00:00'
updated_at: '2026-08-07T16:15:43.758765+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-c7578502
  kind: note
---

Cluster 8 resolved. `REPORT-1582` (`report-c7578502`) created with `report_kind=overlap_resolution`, `subject_uid=report-17a279f7`, `cluster_id="8"`, `result=pass`.

**Verdict: all three stories confirm in place — no reassignment, no merge, no ticket changes.**

The survey saw one capability where there are two hosts. Both exist in code, and neither generalises the other:

| Host | Entry point | Serves | Owner |
|---|---|---|---|
| Local preview server | `startServe()` — `tools/generate/src/cli/serve.ts:37` | one site, one channel, as static files | CAP-82 |
| Workspace origin | `tools/generate/src/cli/builder.ts` | chrome, webui components, browser source, *any* site's channel, plus list/publish/edit | CAP-85 |

`builder.ts:11` imports `resolveStaticFile`/`sendFile` from `serve.ts` — that's the coupling the survey detected, and it's shared *implementation*, not shared ownership. The helper's own comment gives the reason: the builder serves several trees and each needs identical confinement, so there's one implementation and a traversal guard can't be present on one tree and missing on another.

Boundary rule recorded: **CAP-82 owns what bytes a URL names** (including the requirement that it agrees between local preview and production); **CAP-85 owns the workspace surface and the origin hosting it**.

- **STORY-95** — not a local-serving story at all; its 14 ACs are the deployed edge server. Entered the cluster on the word "preview" (a shareable *deployed* URL ≠ the local preview server).
- **STORY-96** — the story the cluster is genuinely about, and it stays whole: the agreement between the two environments *is* the deliverable, and CAP-82's scope names it explicitly. Splitting the local half into CAP-85 would sever a single contract.
- **STORY-99** — the workspace origin is named verbatim in CAP-85's scope; its Technical Context already declares the CAP-82 relationship correctly ("Displays, never produces").

Every story belongs to exactly one capability, none skipped. No merges, so no AC relationships moved and no `test_UAT_AC<n>_*` renaming was required.

One thing I found but deliberately did **not** act on: the workspace origin inherits the extensionless-to-`.html` mapping through the shared resolver, but no AC claims it there (STORY-96's AC-915 is scoped "In local preview"). That's a coverage gap rather than an overlap — it changes no capability assignment, and closing it would mean creating an AC, which is out of scope here. It's recorded in the report with a suggested home (an added AC on STORY-96) in case the matrix wants it pinned later.
