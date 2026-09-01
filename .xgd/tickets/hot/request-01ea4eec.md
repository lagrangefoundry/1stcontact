---
uid: request-01ea4eec
id: REQ-155
type: request
title: 'Capture in workerd: a ReferenceStore port, with the filesystem behind it'
created_by: xgd
created_at: '2026-08-20T23:16:33.604977+00:00'
updated_at: '2026-09-01T18:57:55.118840+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 13
  depends_on:
  - REQ-154
  - REQ-143
  auto_merge_back: true
  needs_review: true
  chat_comment: comment-2b271313
  commits:
  - working_sha: ab467d6ce36618c333604d6b1587cfb6d19557ff
    reconcile_sha: null
    main_sha: null
  version: 0.2.32
---

# Capture in workerd: a ReferenceStore port, with the filesystem behind it

## Why this is its own ticket

Exactly the shape [[REQ-142]] and [[REQ-143]] used for `SiteStore`, and separated for the same
reason: a storage contract buried inside a feature change is a storage contract nobody reviewed.

[[REQ-154]] gives the cloud a browser. It does not give it anywhere to put what the browser
produces. `capture/bundle.ts` writes a bundle as a **directory tree** — seventeen `mkdirSync` /
`writeFileSync` call sites, not the fourteen first counted — and `capture/reextract.ts` reads one
back with `readdirSync`. None of that exists in a Worker.

## What a bundle is, and what must survive

[[DOC-13]] §8 states the constraint in its last clause: *"`storage/references/` bytes move to R2.
The capture pipeline, schema, and bundle are **unchanged**."* This is a port, not a redesign. A
bundle written by the laptop and a bundle written by the cloud must be the same artifact, readable
by either.

| Member | What it is |
|---|---|
| `capture.json` | the capture record |
| `screenshot.full.png` | the full-page shot |
| `screenshot-<width>.png` | the persisted viewport ladder |
| `rendered.html` / `raw.html` | post- and pre-script DOM |
| `assets/` | the referenced bytes |
| `multistate.json` | the multi-viewport ladder — the acceptance oracle |
| `l1.json` | the ladder folded into one L1 document |
| `forms.json`, `hints.json` | derived form model and advisory structural hints |

## The shape of the port

Two levels, because a bundle is the unit every verb already operates on:

- **`ReferenceBundle`** — one bundle's members, addressed by member key
  (`capture.json`, `assets/hero.jpg`, `screenshot-390.png`). `read`, `write`,
  `list`, all async, all bytes. This is what every codec function in
  `capture/bundle.ts` takes in place of a `bundleDir` string.
- **`ReferenceStore`** — the bundles one tenant holds. `bundle(name)` and
  `list()`.
- **`ReferenceStoreRoot`** — `forTenant(id)`, for the R2 adapter only, refusing
  an unknown or inactive tenant at construction exactly as `d1r2SiteStore` does.

Three adapters: `fsReferenceStore` (node-only, `storage/references/`),
`r2ReferenceStore` (the `BLOBS` bucket — captured competitor material is client-private
per [[DOC-38]] §7.1, so it does not belong in `SITES`, which a public Worker serves by path),
and `memoryReferenceStore` for tests and for the shared contract.

## Design decisions taken here

These are the five questions the investigation surfaced. Each is settled below rather than
discovered during implementation.

**1. `reextract.ts` reads through the port; it does not run in workerd.** Its `readdirSync` is
the stated reason for the list verb, but its real blocker is `createServer` — it serves the
bundle over ephemeral loopback so the browser performs a *real navigation* of mirrored bytes
([[DOC-13]] §2.3), and workerd has no `createServer`. So it loses `node:fs` (members come from
the port, served from memory) and keeps `node:http`/`node:net`. It stays node-only, reached the
same way `playwright-driver` is. A Worker route streaming members to a public browser is a
different design and is not in this ticket.

**2. `--ref` stays polymorphic, and the disambiguation stays in the CLI.** `1c diff --ref` takes
either a bundle directory or a loose PNG, told apart by `statSync().isDirectory()`
(`perceptual.ts`). A store has no answer to "is this a directory" and should not grow one:
resolving a *command-line argument* to either a bundle or a file is the CLI's job, above the port.
`perceptual.ts` therefore keeps its own filesystem resolution and takes the ladder screenshot's
path from the fs adapter, symmetric with the `screenshot.full.png` branch two lines below it.

**3. `readLadderScreenshotPath` is split, not ported.** It returns a filesystem path and feeds it
to the image layer — the "NO PATHS" leak `site-store.ts` argues against. The port gets
`readLadderScreenshot(bundle, width): Promise<Uint8Array | null>`; the *path* helper moves to the
fs adapter where a path is a legitimate thing to have. This is the one place REQ-155 and
[[REQ-156]] touch; the split is what stops either eating the other's change.

**4. Bundle identity stays URL-derived and overwriting: `<host>/<pathSlug>`.** The ticket asked for
a name derived from URL *and capture time*. Capture time goes in the record, not the name, for
three reasons: re-capturing a URL must keep replacing it in place (today's semantics, and what
"capture once, re-map forever" assumes); `--ref storage/references/joyfulculinarycreations.com/index`
is a path the operator types; and `bundleDirFor` is pinned by an existing UAT. `capture.json`
already carries `capturedAt`, which is where a generation is distinguished. A timestamped
naming scheme with a `latest` alias remains available and additive.

**5. Tenancy is the R2 adapter's, and the filesystem has none.** There is no D1 on the CLI path
and no `references` table; the R2 root takes `DB` purely to run the same `tenants` check
`d1r2SiteStore.forTenant` runs, and keys everything under `t/<tenant>/ref/<name>/<member>`
([[DOC-38]] §7.2's prefix convention). The filesystem adapter serves one operator and has no
tenant to check — AC5 is a claim about the R2 adapter, stated rather than left to be discovered.

## Non-determinism, stated rather than discovered (AC3)

A locally-captured and a cloud-captured bundle of the same URL will not be byte-equal, and
pretending otherwise would make AC3 unfalsifiable. The known sources: `capturedAt`; whatever the
live site served at each capture time; font-load and layout settle timing; per-engine ladder
differences; and PNG encoder differences between Playwright's Chromium and Browser Rendering's.
The honest claim is therefore **same member set, same schemas, geometry within the existing
gate's tolerance** — which is `values-diff`'s job and not a new one. No PNG is compared byte-wise.

## Blast radius

Bundle members are read outside `capture/` by `repro.ts`, `gate.ts`, `responsive-diff.ts` and
`perceptual.ts`, and `writeL1` / `writeMultiState` / `writeForms` are a fixture-authoring API in
a dozen test files. Every one of those functions is synchronous today, so the port makes the
chain async: `cmdRepro`, `cmdRefold`, `cmdL1Gate`, `referenceCoverage`, `cmdResponsiveDiff`.
That cascade is unavoidable — the port is async totally, for the reason `site-store.ts` gives —
and it is the largest single cost in this ticket. `aligned-crops.ts` reads members with raw
`readFileSync` rather than through `bundle.ts`; it is a developer-only diff verb outside the
capture pipeline and is left as it is.

## Deliberately not here

Re-pointing the *reproduction* verbs (`repro`, `adopt-gaps`) at a non-filesystem store. They now
read through the port because their dependency moved, but the CLI hands them the filesystem
adapter and nothing else: they are the framework-growth loop ([[DOC-21]]), operated by a developer
at a CLI. `refold` is the exception, because AC4 names it.

## Acceptance criteria

1. A `ReferenceStore` port with two implementations — filesystem and R2 — selected by injection,
   as REQ-142 did for sites. No `node:fs` call remains reachable from the capture pipeline
   (`pipeline.ts`, `capture.ts`, `bundle.ts`), and no `node:` import at all remains in
   `capture/bundle.ts`.
2. `1c capture page <url>` runs inside workerd and lands a complete bundle, every member above
   present, against a real R2 bucket.
3. A bundle captured locally and one captured in the cloud, for the same URL, are equivalent
   member-for-member — same member set, same schemas, geometry within the gate's tolerance — with
   the non-determinism stated above rather than discovered.
4. `1c refold --ref <bundle>` re-derives `l1.json` and `forms.json` from a stored bundle without
   re-hitting the site, in both implementations.
5. Bundles are tenant-scoped, and a read across tenants is refused at the same layer `SiteStore`
   refuses it — `forTenant` throws `UnknownTenantError` for an unknown or inactive tenant, and a
   handle for one tenant cannot address another's keys.
6. Every CLI verb taking `--ref <dir>` behaves identically against the filesystem implementation.

## Test plan

- `tests/support/reference-store-contract.ts` — one body of assertions, run against every
  adapter, mirroring `site-store-contract.ts`. Registered from the node project (filesystem,
  memory) and the workers project (R2).
- `tests/test_UAT_FC_REQ-155_reference_store.test.ts` — the node-side registration plus AC1
  (no `node:` import reachable from the capture pipeline, asserted structurally against the
  source), AC4 (`refold` over both node adapters), AC6 (`--ref <dir>` behaviour unchanged).
- `tests/test_UAT_FC_REQ-155_reference_store.workers.test.ts` — the workers-side registration
  plus AC2 (a whole bundle landed inside workerd through `cmdCapturePage` with an injected fake
  driver and a real R2 bucket), AC3 (member-set and schema equivalence against a bundle the node
  adapter wrote), AC5 (tenant refusal and key isolation).
- Regression scope: `tests/capture.test.ts`, `tests/req22-storage.test.ts`,
  `tests/req58-multi-viewport.test.ts`, `tests/req83-capture-to-l1-fold.test.ts`,
  `tests/reconciliation-l1-fold*.test.ts`, `tests/reconciliation-size-aware-diff.test.ts`,
  and every suite importing `writeL1` / `writeMultiState` / `writeForms`.

## Origin

[[CHAT-27]]. Second of four: the browser can see, and now there is somewhere to keep what it saw.