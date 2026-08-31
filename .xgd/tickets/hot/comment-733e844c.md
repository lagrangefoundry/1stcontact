---
uid: comment-733e844c
id: COMMENT-1909
type: comment
title: Comment on request REQ-159
created_by: xgd
created_at: '2026-08-31T21:50:25.767051+00:00'
updated_at: '2026-08-31T22:18:28.675507+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-119dd4af
  kind: chat_transcript
---

<!-- xgd-turn id="40e22d52-75e8-490e-b39a-affab2443e45-user" -->

<!-- xgd-chat role="user" ts="2026-08-31T21:49:48.391753+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="40e22d52-75e8-490e-b39a-affab2443e45-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-31T22:18:28.468114+00:00" -->
#### Claude
Now let me start the free-coding flow.

Now writing the implementation.

Now the knowledge shim in `assets.ts`:

Now the main module — `apps/control-app/src/knowledge.ts`:

Now the awareness-report type in `tickets.ts`:

Now the `[ai]` binding in `wrangler.toml`:

Now commit and merge back.

Now updating the ticket body to reflect what landed:

Done. REQ-159 is at `free_coded`, commit `115f0d39ec`, version `0.2.23`, merged into `xgd-working`.

## What landed

**`kb/knowledge_bases.json`** — `project` declared beside `system`: corpus `[chat, material, reference, brief]`, `landscape: derived`, no `source` key (so it reads the tenant's store), no site term. Each host names the KBs it serves, so `bindKb` was narrowed to `system` alone — otherwise the release build would resolve a tenant corpus against a read-only directory of design docs and report it as searchable and empty.

**`apps/control-app/src/knowledge.ts`** — the capability:
- `r2IndexSource` puts the index in **BLOBS** under `kb/<tenant>/project/…` — explicitly *not* the bundle (tenant data, written continuously) and not SITES (it's a derivative of private material).
- `onMaterialWritten` awaits the index refresh, then hands the map rebuild to an injected `Deferral` seam (`waitUntil` in a Worker). `onTranscriptGrew` batches at 4000 chars and **never** touches the map.
- The floor: enumerated listing below ~1KB, clustered above. Nothing bolded in the listing, because the component reads a bolded term as a *validated* access point.

**Also**: `system`/`awareness_report` declared in the product TypePack (the store refuses undeclared types, so the first rebuild would have failed validation); a third generated shim for the knowledge component; `[ai]` binding on both wrangler halves.

## Three decisions you should know about

1. **The enumerate budget follows DOC-39 §7, not the ticket body.** The body said "title plus ~200 chars, 2–4KB"; §7 settles it as titles-only at ~1KB, with an excerpt as a per-entry fallback for an uninformative title. The ticket says DOC-39 is the spec and shouldn't be re-decided.

2. **Not wired into session priming — that's REQ-160**, which names this ticket as its dependency. So the acceptance's behavioural test ("the AI answers from the document") is proved here only as far as it goes: the document indexes and `search()` returns it. REQ-160 completes it.

3. **Known gap: the clustered path needs a describer the Worker doesn't have.** The bridge's own is Node-only (it needs the provider backends), so `describe` is a required injected seam above the floor and `DescriberNotConfiguredError` names it when absent — the previous map stands rather than being replaced by a mechanical paragraph. Below the floor, which is every new tenant, no model call is needed at all. A Worker-side describer is a follow-up.

## Evidence

12 UATs in workerd against real D1 and real R2 through the real knowledge component — the embedder is the only double, and it's the component's declared model seam (miniflare has no local Workers AI regardless). Plus 8 node UATs pinning the declaration, the AI binding on both wrangler halves, the scaffold, and the generated shim's export list against the component.

Regression: whole workerd project green (13 files, 110 tests). Nine node files fail in the worktree — each fails identically at the branch point with my changes stashed; they're the known linked-worktree asset-404 artifact plus two KB suites already broken by the upstream `prompt` → `description` rename.

One note: `xgd-working` had moved to `0.2.22` mid-session, so I amended the branch commit to bump to `0.2.23` rather than resolve the version conflict in the merge — that keeps the recorded SHA the one that introduced the claimed version.

<!-- xgd-chat-end -->