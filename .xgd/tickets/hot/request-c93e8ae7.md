---
uid: request-c93e8ae7
id: REQ-397
type: request
title: 'Builder sessions: leased locks on draft files, and the consultant taught to
  plan by file'
created_by: EPIC-24
created_at: '2026-10-10T18:27:47.607769+00:00'
updated_at: '2026-10-10T18:27:47.607769+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
---

## Status

Draft. Child of EPIC-24, pieces 2 and 3 of the operator's simplified plan (2026-10-03).
- **Depends on lagrange-framework REQ-207** for the `scope` claim hook on Delegate, and for actually running builder sessions concurrently.
- **Uses the file names from REQ-396 (page decomposition).** Locks on undecomposed pages and on the site file work without decomposition. Section locks need it.

The priming must keep saying "one at a time" until lagrange-framework REQ-207 is live in the installed framework.

## Intent

**One agent per file at a time.** A builder session holds a leased lock on each draft file it will write. A write to a file the session doesn't hold is refused, and so is a lock on a file someone else holds. The client's own hand edits respect the same locks. The consultant is taught decomposition and locks and plans parallel work as one builder session per file. It must never promise parallel work it hasn't set up this way. That's all there is to the concurrency story: no scope algebra and no version merging.

## Where we are, verified

- Draft writes are unconditional. `sites.version` plus `SiteWrite.expect` give a working compare-and-set (`tools/generate/src/store/d1r2-store.ts` ~L828–853), but `editL1Set`, `editCopySet` and the routes never pass `expect`. Only `store/upgrade-site.ts` does.
- No lock or lease covers draft writes. `site_revision_claims` reserves publish revision ids only. There is no per-site Durable Object.
- A builder session is `worker-builder-<id>`, opened by `DelegationRuntime` and wired in `tools/generate/src/cli/ai/host-core.ts` ~L1638–1690. The consultant is `site-<slug>`.
- Client hand edits: `POST /api/copy` (`apps/control-app/src/router.ts` ~L6573, `editCopySet`), `/api/palette` (~L6270), `/api/pages/subject` (~L5672).
- Workers that end silently or abort (BUG-191) are reported by `account-core.ts` `workerEnding`, but nothing they held is released, because nothing is held.
- `priming.json` already says "Builders run one at a time" (`delegation-method` ~L271, `delegation-reminder` ~L274–275).

## What changes

1. **Files.** The lockable units are the **site file** (palette, text styles, fonts, nav, site config), each **page frame**, each **section**, and each **undecomposed page**. Names come from REQ-396.
2. **Lease table.** Add a D1 table of `(site_id, file, holder, acquired_at, expires_at)`. Acquire is atomic and all-or-nothing for a set of files. Leases are renewed by the holder's activity (each tool call) and expire after a short idle period (default 5 min), so a session that dies or aborts silently can't hold a file forever. Release is explicit.
3. **Builder sessions declare files up front.** The consultant passes `scope` on Delegate (lagrange-framework REQ-207). The host's `claim` hook acquires the leases for the worker's session id and refuses the delegation before the worker opens if any file is held. The refusal names the file, the holder and how long it has been held. Release happens in the framework's `finally`.
4. **Write tools enforce it.** Every draft write path (`set_l1`/`group_l1`/`flow_l1`, `set_page_style`, `use_font`, page/palette/text-style/asset/component/config writes) checks that the calling session holds the file(s) it touches. Otherwise it refuses with a clear message ("`home/hero` is not in this session's scope" / "held by builder X since 14:02"). A builder writing outside its scope is refused even when nothing runs in parallel. That's a guard in its own right.
5. **The consultant's own writes** (when `primary_writes` is on) take a lease implicitly for the duration of the write and are refused if a builder holds that file.
6. **Client hand edits respect locks.** The builder-UI write routes refuse with 409 and the holder's description when a builder holds the file. The UI shows that the section/page is being worked on. The client's edit takes a brief lease, so a builder can't claim a file mid-write.
7. **Draft writes become compare-and-set.** Pass `SiteWrite.expect` on every draft write path so a lost race between lease check and write is refused, not silently won. This reuses the existing mechanism; nothing new is built.
8. **Visibility.** The operator and the client can see what's held: which builder session, which files, and for how long. That is a read endpoint over the lease table, surfaced where the cadence/status work shows running builders.
9. **The consultant is taught.** Priming and the Delegate/L1 manuals explain decomposition, files, scopes and locks. The consultant decides how to decompose an existing page, splits it, builds new pages already decomposed, and plans parallel work as one builder session per file. The text says sessions run one at a time until REQ-207's concurrency is installed, then says exactly what may overlap: different files, never the same file, and the site file always alone. It must never promise parallel work it hasn't set up this way.
10. **Spend.** Each session's cost is recorded as today. The concurrency cap is configured in `delegation.json` (default 3).

## Test plan

UATs through the real host/toolbox and routes, with a scripted model backend: a second delegation claiming a held file is refused before any worker session exists; a builder writing a file outside its scope is refused; `/api/copy` on a builder-held section returns 409 naming the holder; an expired lease (dead session) is reclaimable; release on worker report, error and stop; a stale write loses the CAS and is refused; priming renders "one at a time" when concurrency is off and the overlap rules when it is on.
