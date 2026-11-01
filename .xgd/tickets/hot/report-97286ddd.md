---
uid: report-97286ddd
id: REPORT-7407
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:43:30.654982+00:00'
updated_at: '2026-11-01T06:43:30.654982+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

Cherry-pick of 2c8cf21f88 ("Merge branch 'free-BUG-46' into xgd-working").

- `apps/control-app/src/router.ts` — UU, code file (2c). Two hunks: incoming `chatHost(env, deps)` vs HEAD `chatHost(env, deps, url.origin)`. HEAD is an extension of incoming (same line plus the later-added `origin` argument; HEAD's `chatHost` signature at line 124 requires `origin: string`, so the incoming 2-arg call would not type-check). Kept HEAD.
- `tools/generate/src/cli/ai/host-core.ts` — UU, code file (2c). Hunks:
  1. HEAD's `reminderFor` (REQ-131/REQ-160) vs incoming not having it (incoming predates it); still called at line 692. Kept (non-overlapping HEAD addition).
  2-4. `storedTranscript` signature/`live` derivation and its call site: incoming derived `live` via `deps.lib.closedPrefix(records).length !== records.length`; HEAD (commit 18488bb509, BUG-64) takes `live` from upstream `manager.transcript` instead. Kept HEAD; see below.

Net result: both files identical to HEAD; staged diff vs HEAD is empty for code (redundant commit — BUG-1109/BUG-1122 shape). Left for cherry_pick_finalize_resolution to skip.

## Incoming changes preserved

Verified against `git diff 2c8cf21f88^1 2c8cf21f88` — all BUG-46 changes are already present in HEAD:
- router.ts: `tailSession` import (l.23), `RouteContext` interface + `ctx` threading through `route`/`routeUncached`/`streamTurn` (l.612-629, 1379), `ctx?.waitUntil(drained)` + `settle()` + `tell` helper (l.1394-1444), `POST /api/ai/reattach` route (l.1154), `streamTail` (l.1474).
- host-core.ts: `TEXT`/`DONE` constants (l.89-90), `ChatSession.cursor`/`live` fields (l.144/160), `storedTranscript` reading the junction via `manager.transcript` with the `archive.list()` discriminator (l.766-774), `openSession` returning `cursor`/`live` (l.874), `tailSession` generator over `manager.watch` (l.976-990).

The one incoming detail not kept is the `closedPrefix(records).length` re-derivation of `live` (plus the `deps` parameter it needed). Not dropped as a shortcut: it was superseded by HEAD commit 18488bb509 (BUG-64), whose in-code rationale states `closedPrefix` returns a COUNT so `.length` was undefined and every session read as mid-turn, and replaced it with upstream's `read.live`. Restoring it would undo the BUG-64 fix (BUG-1301 precedence: already-integrated, documented fix).

## Flags for post-merge review

Enrichment rule ("intent unknown on one side") asked to flag both files: `apps/control-app/src/router.ts`, `tools/generate/src/cli/ai/host-core.ts`. No typecheck or tests run during resolution.
