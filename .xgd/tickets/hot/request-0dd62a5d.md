---
uid: request-0dd62a5d
id: REQ-142
type: request
title: An async SiteStore port, with the filesystem behind it
created_by: xgd
created_at: '2026-08-15T20:31:09.480730+00:00'
updated_at: '2026-08-16T00:38:27.133800+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 13
  auto_merge_back: true
  needs_review: false
  depends_on:
  - REQ-141
  ready_since: '2026-08-15T21:31:06.025399+00:00'
  blocked_by: []
  not_blocked_by:
  - request-b18d2056
  - request-7bef34e0
  - request-23fd6e61
  - bundle-d9226698
  dependency_eval_state:
    evaluated_at: '2026-08-15T20:41:13.336513+00:00'
    evaluated_against:
    - request-b18d2056
    - request-7bef34e0
    - request-23fd6e61
    - bundle-d9226698
---

# An async `SiteStore` port, with the filesystem behind it

Every write the builder performs bottoms out in `node:fs`. A Worker has no filesystem, so the
store must become an **interface** before it can become a Cloudflare one. This ticket
introduces that interface and moves the existing filesystem behaviour behind it — **with no
behaviour change at all**.

The D1/R2 adapter is [[REQ-143]] and is deliberately not in scope here. Splitting them is what
makes this ticket's correctness claim checkable: if the port is right, the whole existing suite
passes unchanged.

## 1. The seam that exists, and the one that does not

[[DOC-12]] §7 says "the Worker reaches storage through a single `SiteStore` accessor; phase 2
swaps only its implementation." That is **true on the read path and false on the write path**:

- `preview.ts` already declares a `DraftStore` interface with an `fsDraftStore` implementation —
  the seam DOC-12 describes, for reads.
- `edit.ts` calls `writeJson`, `removePath`, `copyFileSync` and `writeFileSync` **directly**.

So the doc describes an intention, not the code. Closing that gap is this ticket.

## 2. Why it is smaller than `edit.ts`'s size suggests

`edit.ts` is ~79KB, but its store surface is **four verbs**, at ~25 write sites and ~15 read sites:

| Verb | Sites |
|---|---|
| write a page | `writeJson(file.abs, page)` |
| write `site.json` | `writeJson(siteJsonPath(...), newBase)` |
| delete a path | `removePath(...)` |
| put an asset | `ensureDir` + `copyFileSync` / `writeFileSync` |

## 3. The real cost: sync to async

**This is the budget line, and it is not the port.** `edit.ts` exports **31 functions, none
async**. D1 and R2 are async, so those 31 become async and it propagates outward — into
`builder.ts`'s route handlers and into the `1c` CLI, which dispatches to the same functions.
That mechanical conversion touches more of the tree than the port itself does.

## 4. Two adapters, one port — and why that is not a legacy mode

`CLAUDE.md` forbids legacy/fallback modes. This is not one. Both adapters are **live and
current**: the `1c` CLI edits `storage/sites/` on the operator's machine (git-tracked per
[[DOC-12]] §3.1, a property we are deliberately keeping), and the Worker will reach D1/R2.
Neither is a preserved old path; there is no mode detection, and no caller chooses between them
at runtime — the adapter is injected at construction.

**Precedent:** `@lagrangefoundry/ticketing`'s `docs_store.js` splits the *reader* from the store
for exactly this reason, keeping `node:fs` behind a separate `./node` entry point so the
Worker-safe path never imports it. Follow that shape.

## 5. Deliverables

- An **async** `SiteStore` port: read/write/delete page, read/write `site.json`, list pages,
  put/delete/list asset. Small and total — no path-shaped escape hatches (an `asset()` that
  returns an absolute filesystem path is a filesystem leak, not a port).
- An `FsSiteStore` implementation carrying today's behaviour, including its atomicity
  characteristics — this ticket does not improve them, and does not regress them.
- `edit.ts`'s 31 exported functions converted to async; call sites in `builder.ts` and the CLI
  updated.
- The existing `DraftStore` read seam reconciled with the port rather than left beside it as a
  second, narrower one.

## 6. Acceptance criteria

1. The full existing suite passes with no assertion changed. This is the whole correctness claim.
2. No `node:fs` or `node:path` import remains in `edit.ts`.
3. `1c copy set`, `1c palette`, and the asset commands behave identically at the CLI, including
   their error envelopes — `CommandError` still reaches the modal as a 400 with code/path/hint.
4. A UAT drives the port through a fake in-memory adapter, proving no caller depends on the
   filesystem.
5. A multi-file write (`site.json` plus N pages, as at `edit.ts:1760-1765`) is expressed as one
   port call, so the D1 adapter can make it atomic later without revisiting callers.
6. Clean `pnpm -r build` and typecheck; no new lint warnings.

## Origin

[[CHAT-25]]. Depends on [[REQ-141]] for the harness the fake-adapter UAT runs in.
## 7. Decisions taken during implementation (2026-08-15)

These were underdetermined by §5 and are recorded here because they are the shape
REQ-143 builds on.

**Injection.** The store is a required `store: SiteStore` field on the options object
every `edit*` function already takes (`EditOptions extends GlobalOptions`). `edit.ts`
imports the port's *types* only; `fsSiteStore(ctx)` lives in a Node-only entry
(`store/fs-store.ts`) so the Worker-safe path never pulls `node:fs`, following
`docs_store.js`'s `./node` split. Required rather than optional so the compiler
finds every call site.

**Port width.** §5's eight verbs are not sufficient for AC-2: `edit.ts` also reaches
the change journal (`appendChange`/`changesSince`/`draftCounter`) and computes
`status` by diffing the live revision against `draft/`. Both are port verbs —
`counter`/`appendChange`/`changesSince` and a single `pendingChanges(slug)` — rather
than left for REQ-143.

**Asset sources.** `editAssetAdd` read a path on the operator's own disk, which is not
the store and has no meaning in a Worker. The source read moves out to its two callers
(the CLI and the AI toolbox adapter); the function takes bytes. `1c asset add <file>
--as` and the tool's declared `file` parameter are unchanged, and the NOT_FOUND
envelope for a missing source file is raised at the call site with identical
code/path/hint.

**Preview assets.** `DraftStore.asset()` returning an absolute path is the leak §5
rules out, so it becomes `readAsset(slug, rel): Promise<Uint8Array | null>` and
`PreviewFile`'s `{ kind: 'file' }` carries bytes. This trades `sendFile`'s streaming
for a buffered read on the dev builder's asset path.

**Scope held.** `commands.ts` (`new`/`publish`/`checkout`/`render`/history) stays on the
filesystem directly; `FsSiteStore` delegates `loadDraft` to the existing `loadSite`.

## 8. The site factory

REQ-141 delivered the vitest project split and nothing else — there is no reusable site
fixture. Every test that needs a site still rolls its own `mkdtemp` + `cmdNew` +
`writeFileSync` preamble, and that preamble is precisely the thing that cannot cross
into workerd.

So this ticket also ships **one site factory, two backends behind the port**:

- `makeFsSite(...)` — a temp-directory site plus its `FsSiteStore`, replacing the
  hand-rolled preamble, with disposal.
- `makeMemorySite(...)` — the same site over the in-memory adapter, no filesystem at
  all. This is what AC-4 drives.

Both return the same handle (`{ slug, store, opts }`), so a test written against one
runs against the other unchanged. That equivalence is the factory's whole point: it is
what makes "no caller depends on the filesystem" a property a test can assert rather
than a claim.

## 9. Acceptance criteria added

7. A site factory under `tests/support/` yields the same handle over the filesystem
   adapter and the in-memory adapter, and a UAT drives the same body of assertions
   through both.
