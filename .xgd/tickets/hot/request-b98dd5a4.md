---
uid: request-b98dd5a4
id: REQ-303
type: request
title: The per-turn site digest must not read asset bytes
created_by: EPIC-16
created_at: '2026-09-22T23:12:02.940575+00:00'
updated_at: '2026-09-22T23:12:02.940575+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: critical
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
---

## Why

Chat is dead for Lagrange Foundry in production. Every turn fails with
`outcome=exceededMemory` (`wallTime=14843ms`, `cpuTime=8815ms`), and the client sees
*"the connection to this reply was lost"* with no error text at all.

The cause is on the per-turn path. `collectSiteDigest` (`tools/generate/src/cli/ai/digest-core.ts`)
calls `pendingChanges`, which calls `readDraftSnapshot` (`tools/generate/src/publish/publish.ts:146`),
which loops over every asset and reads its bytes:

```
for (const name of assetNames) {
  const bytes = await store.readAsset(slug, name)
  if (bytes !== null) assets.push({ name, bytes })
}
```

Those bytes then pass through `byteKey` (`tools/generate/src/store/revision-model.ts:153`),
which builds a JavaScript string **one character per byte** via `out += String.fromCharCode(...)`.
Against a 128 MB Workers isolate — a platform constant, not a configurable; wrangler accepts
only `cpu_ms` under `[limits]` — this is fatal well before the site is large.

Measured in production:

| business | assets | bytes | chat |
|---|---|---|---|
| Lagrange Foundry | 17 | 50.00 MB | OOM, every turn |
| Gigabyte Alchemy | 5 | 2.58 MB | fine |
| XGD | 11 | 0.37 MB | fine |
| 1st Contact | 6 | 0.00 MB | fine |

**The digest never looks at the bytes it paid for.** It uses exactly two values off the
result: `pending.baseRevision`, and the sum `added.length + modified.length + removed.length`.
A byte-exact snapshot of the whole site is read to produce a revision id and a count.

REQ-285's decision to reuse `pendingChanges` rather than grow a second idea of "is anything
unpublished" was sound and is not being reversed. What it did not price is that the function
was written for publish — where a byte-level snapshot is the point, and the cost is paid once
on a deliberate action — and the digest put it on a path that runs before every model call.

## Required behaviour

1. Deriving the per-turn site digest **reads no asset bytes**. The number of bytes read while
   building a digest does not vary with the size or number of a site's assets.
2. The digest continues to report the same two facts it reports today, with the same meanings:
   the live base revision (`live`), and the count of unpublished changes (`pending`). A site
   with unpublished work still says so; a site with none still says none.
3. The count covers the same three kinds of change `pendingChanges` covers — added, modified
   and removed — across the same three path families: `site.json`, `pages/<name>`, and
   `assets/<name>`. An asset whose content changed while its name stayed the same still counts
   as modified.
4. The digest remains derived afresh on the turn it is delivered, and is not cached. BUG-128's
   finding stands: a cached digest quotes superseded numbers.
5. A site with a large asset set produces its digest in time and memory comparable to a site
   with a small one. Lagrange Foundry (50 MB, 17 assets) completes a chat turn.
6. Where the digest can no longer answer, it stays silent rather than failing the turn — the
   existing `siteDigestSource` contract. Note that this contract does **not** hold against the
   current failure: an OOM kills the isolate, so the `try/catch` never runs. Removing the byte
   reads is what makes the guard meaningful again.

## Scope

Assets already carry a `size` column in `site_assets` alongside `name` and `r2_key`, and R2
supplies an etag per object. Whether the count is derived from those, from a new per-asset
digest, or by some other means is the implementer's call — provided the behaviour above holds
and no asset bytes are read.

**Out of scope, deliberately:** publish's own use of `readDraftSnapshot`, `snapshotSha` and
`byteKey`. Publish has the same problem and a larger one besides, but it is a deliberate,
infrequent action rather than a per-turn cost, and fixing it properly means changing how assets
are stored. That is its own requirement. This ticket is the contained change that gets a
customer's chat working again and can ship on its own.

If the chosen approach happens to retire `byteKey` for the digest's path only, that is fine;
retiring it everywhere is the other ticket's business.

## Acceptance

- A chat turn against a site with tens of megabytes of assets completes.
- The digest's `live` and `pending` values match what `describe_site` reports for the same site
  at the same moment — the agreement REQ-285 was protecting.
- Digest derivation cost does not scale with asset bytes.
