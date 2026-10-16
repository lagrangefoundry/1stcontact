---
uid: request-c93e8ae7
id: REQ-397
type: request
title: 'Builder sessions: leased locks on draft files, and the consultant taught to
  plan by file'
created_by: EPIC-24
created_at: '2026-10-10T18:27:47.607769+00:00'
updated_at: '2026-10-16T18:41:17.559327+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-54a6cfea
---

## Status

Implemented (free-coded, 2026-10-16). Child of EPIC-24, pieces 2 and 3 of the operator's simplified plan (2026-10-03).
- **Depends on lagrange-framework REQ-207** for the `scope` claim hook on Delegate, and for actually running builder sessions concurrently. **REQ-207 is not yet in the installed framework**, so today: builders aren't scoped, their writes take implicit leases, and the priming still says "one at a time". The text and enforcement switch on by themselves when REQ-207 is installed (detection reads the installed Delegate declaration).
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



## As built: implementation decisions

- **One enforcement point: a store decorator.** Every draft write in this repo already goes through `SiteStore.write`, so `leasedStore(store, leases)` (`tools/generate/src/store/leased-store.ts`) wraps that verb, on `cappedSiteStore`'s precedent. The Worker leases every store it opens (`openSiteStore` in `router.ts`, D1 table); `1c` (the chat host and the local builder) uses one in-process table per workspace (`localLeases`). No edit function changed.
- **Who is writing is per call, not per store.** One store serves every session on a site, so the writer comes from an `AsyncLocalStorage` context (`asWriter`): each builder tool call runs as its worker session (scoped), each consultant tool call as `site-<slug>` (implicit), each builder-UI request as `client` (implicit), and anything unattributed as `system` (implicit).
- **File names** are REQ-396's: `site.json`, a page `home.json` (whole page, or the frame of a decomposed one), a section `home.json#hero`, plus each asset `assets/<name>`. Names compare exactly; holding a frame doesn't hold its sections.
- **Scoped writers (builders) vs implicit writers.** A builder may write only the files its delegation claimed, plus files it creates (a new section or asset nobody holds), which it then holds. A file in scope whose lease lapsed is taken back on write if nobody else holds it. Every other writer takes a brief lease on exactly the files the write changes, for the duration of the write, and is refused if anyone else holds one.
- **A page name in `scope` claims the page and every section it has now**, so "build the About page" is one name. Anything that isn't a draft file name is refused with the list of what is.
- **The compare-and-set is per file.** The store's `expect` is site-wide, and using it raw would make two builders on different files refuse each other. The decorator remembers, per call, each file as the call read it; at write time it re-reads only the touched files, refuses with `FILE_CHANGED` if one changed underneath the call, then writes with `expect` = the version it just checked, and redoes the check (up to 4 times) if an unrelated write lands in between. The memory store now honours `expect` too (the fs store still can't). A write whose content wouldn't change a file doesn't touch it.
- **Refusals** are one error class, `DraftFileRefusal`, codes `FILE_HELD` / `NOT_IN_SCOPE` / `FILE_CHANGED`. Its code isn't one the L1 surface declares, so the toolbox shows the model the sentence verbatim, e.g. "`home.json#hero` is held by builder worker-builder-… since 14:02 UTC (3 min); nothing was written…" / "`home.json#hero` is not in this session's scope (home.json#story); nothing was written. Report it rather than writing elsewhere."
- **Leases**: `draft_leases(site_id, file, holder, acquired_at, expires_at)`, migration 0029. Acquire is one D1 batch (all or nothing, guarded with the same re-insert trick as the store's CAS); expired rows are deleted lazily. A builder's leases are renewed on every tool call and expire after `delegation.json` `lease_idle_seconds` (default 300). Implicit leases last 60 s at most and are released when the write ends.
- **Claims (framework REQ-207).** The builder `WorkerConfig` gets `claim`. It validates and expands the scope, acquires it for the worker's session id, and returns the release handle the framework runs in its `finally`. A held file refuses with "`home.json#story` is held by builder X since 14:02 UTC (3 min), so this builder was not started and nothing was spent…", which the framework returns as `scope_held`. A delegation with no scope is allowed: that builder can create files but write no existing one. Against a framework without REQ-207 the hook is never called, builders aren't scoped, and their writes are implicit leases.
- **Client hand edits.** Routes run as `client`. A refusal maps to 409 carrying `code`, `file`, `holder` (in words) and `since` (the general handler, so `/api/copy`, `/api/palette` and `/api/pages/subject` all get it). `GET /api/copy` adds `busy` when a builder holds the element's file, and the copy modal then says "builder X is working on this since 14:02 UTC (3 min). You can edit it once that work has finished." instead of opening a form.
- **Visibility.** `GET /api/leases?site=` lists every held file with holder, who (in words), since and expiry. A build's status line (REQ-360 heartbeat) gets " — builder X on home.json#story since 14:02 UTC" appended, plus `meta.held`.
- **Concurrency.** `delegation.json` `max_concurrent` (default 3, ≥1) is passed to the consultant's backend as `maxConcurrentTools` (REQ-207's cap). Spend is recorded per session as before.
- **Priming.** `delegation-method` and both reminders have a `{parallel}` slot:
  - Today's "Builders run one at a time…" text, unchanged, where the installed Delegate has no `scope`.
  - Files/scopes/decomposition teaching, still followed by one-at-a-time, where scopes are enforced but Delegate isn't concurrent or `max_concurrent` is 1.
  - The overlap rules where the framework runs Delegate concurrently and the cap is above 1: "Up to N builders run at once… never two on the same file, a builder on `site.json` always alone… Never tell your client that work runs in parallel unless you commissioned it that way."
  - Detection reads the installed Delegate declaration (`scope` param, `concurrent: true`), so the text changes when the framework is installed, with no edit here.

## As built: UATs

- `tests/test_UAT_FC_REQ-397_draft_file_leases.test.ts` (node; real L1 operations, real lease decorator, real `claim` hook, memory store, fake clock):
  - a second claim on a held file is refused, naming the file, the holder and how long, and takes nothing;
  - a builder writing outside its scope is refused even alone, and writes its own file;
  - two builders on different sections both write;
  - the consultant and the client are refused on a builder-held file and write free ones; the implicit lease ends with the write;
  - acting renews, and a quiet session's lease expires and is reclaimable;
  - release frees every file;
  - a page name claims its sections, and a non-file name is refused;
  - a builder holds a section it creates;
  - a stale write on its own file is refused `FILE_CHANGED`;
  - a write to another file in between is not a conflict;
  - priming says one at a time without scopes, teaches files with scopes, and states the overlap rules and cap with concurrency;
  - `delegation.json` cap and idle period, and their validation.
- `tests/test_UAT_FC_REQ-397_draft_file_leases.workers.test.ts` (real routes in workerd, real D1, real session manager and delegation surface, scripted model):
  - `/api/copy` on a builder-held section is 409 naming the holder, with `busy` on GET, the next section editable, and `/api/leases` listing it;
  - a delegation naming a held file is refused `scope_held` before any worker request;
  - a delegated builder writing outside its scope is refused through the real tool loop, its own section is written, and its files are released on report;
  - a running build's status line names the files it holds;
  - a builder that fails releases its files;
  - in D1, an expired lease is reclaimable and acquire is all or nothing;
  - in D1, a stale write loses the per-file CAS;
  - the consultant's system prompt carries the overlap rules at cap 3 and one-at-a-time at cap 1.
- **The workers delegation cases need lagrange-framework REQ-207 installed** (`cd ../lagrange-framework && bin/install --lang js --component all`). Release on *stop* is the framework's guarantee (REQ-207's own UAT (e)). The host's release is the same function whatever ended the run, so it isn't re-tested here.
- **Gating.** The five workers cases that go through a delegation (held-file refusal, out-of-scope write, status line, release on failure, overlap rules in the prompt) are `skipIf` the installed Delegate lacks `scope` and concurrency, read at collection the same way the host reads it, because nothing in this repo can make them pass before REQ-207 is installed. The route, D1 and compare-and-set cases always run. Verified: 8/8 pass against the framework with REQ-207's commit applied; 15 pass / 5 skip against today's installed framework.
- **Existing priming UATs updated.** REQ-295, REQ-342 and REQ-343 tests build the expected text from the templates. They now also fill the new `{parallel}` slot with the serial text. The rendered words are byte-identical to before.
