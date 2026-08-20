---
uid: comment-bda48193
id: COMMENT-1207
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-20T01:15:39.716262+00:00'
updated_at: '2026-08-20T01:15:39.716262+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6b00ff2e
  kind: note
---

Cluster 6 resolved: **all three stories confirmed in place — no reassignments, no merges.**

## What the cluster actually was

Two capabilities that both appear to "serve a site's pages locally":

- **CAP-82** (`capability-a12e557f`, Site Delivery) — STORY-95 (deployed public server) and STORY-96 (clean-URL agreement between local preview and production)
- **CAP-85** (`capability-a994b8f3`, Builder Workspace) — STORY-99 (the workspace origin)

## Why confirm rather than move

I verified in code rather than trusting ticket prose. These are two genuinely distinct HTTP surfaces, two CLI commands, two `http.createServer` instances:

| Surface | Entry point | Owner |
|---|---|---|
| `1c serve <slug>` — single-site static server, one root | `startServe`, `tools/generate/src/cli/serve.ts` | CAP-82 |
| `1c builder` — three file trees + request-time channel renders + `/api/*` | `startBuilder`, `tools/generate/src/cli/builder.ts` | CAP-85 |

Confinement, URL resolution and miss semantics show up on both sides because `resolveStaticFile` / `sendFile` / `MIME` in `cli/serve.ts` are a **shared helper** called from both entry points — `startServe` directly, the builder origin via its own `serveTree`. Shared implementation, not a shared claim: AC-922 pins confinement on the preview server (that the clean-URL mapping can't widen reach), AC-978 pins it across the builder origin's three trees (that it's identical on every tree — a property that only exists because there's more than one tree). Neither asserts the other's surface, so collapsing them would leave one surface unverified.

The boundary is also already declared identically from both sides: CAP-82's scope names the local preview server for the URL-resolution agreement, and STORY-99's technical context explicitly disclaims the preview server's freshness change ("no criterion here claims it"). Two capabilities naming the same line the same way is the signature of a clean split.

## One thing worth flagging

The local preview server's **own caching behaviour is claimed by no AC in either capability**. STORY-99 added `NO_STORE` to the shared send path and deliberately declined to claim the knock-on effect on `1c serve`; STORY-95/96 predate it. That's a coverage gap for a future ticket against CAP-82 — not a cluster ambiguity, and no reassignment or merge would close it. It's recorded in the report.

**Report**: `REPORT-2296` (`report-6b00ff2e`) — `report_kind=overlap_resolution`, `subject_uid=report-2485c83c`, `cluster_id="6"`, `result=pass`. Verified the fields landed. No ticket writes were needed, so no `--commit-message` calls were made. (The `git push` in the report-create output failed — network is offline in this sandbox; the ticket committed locally.)
