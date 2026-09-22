---
uid: request-d21899ba
id: REQ-304
type: request
title: Publish must compare and freeze assets by content identity, not content
created_by: EPIC-16
created_at: '2026-09-22T23:12:29.737145+00:00'
updated_at: '2026-09-22T23:12:29.737145+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
---

## Why

`publishSite` materialises the entire site in memory, several times over, and cannot carry a
site an ordinary small business would consider modest.

What it holds live at its peak (`tools/generate/src/publish/publish.ts:300-345`):

| # | held | size |
|---|---|---|
| 1 | `previous` — `store.readRevision(slug, live)`, the live revision read back whole, asset bytes included | N |
| 2 | `draft` — `readDraftSnapshot`, asset bytes included | N |
| 3 | `ladder.derived` — every rendition accumulated in a `Map<string, Uint8Array>` | ~0.7 N |
| 4 | `rendered` — `renderSiteFiles` output | small |
| 5 | `snapshotSha(draft)` — the whole listing joined into ONE string, then `TextEncoder`; bytes ≥ 0x80 become two UTF-8 bytes each | ~1.5 N |

Nothing streams. Each stage materialises the whole site and hands it to the next. Peak is
roughly 4 N against a 128 MB isolate, and two of those copies exist before a single pixel is
resized — which puts the ceiling at roughly **20–25 MB of source assets, on the order of
10–15 photographs**. Lagrange Foundry (50.00 MB) is already past it and cannot be published.

The operator's framing, which this ticket accepts: *"a real site could have a dozen pages with
twice that number of images on each — and I would not call that big."*

**The conflation at the root.** Publish asks *what is the content* when the only thing it ever
needs is *what is the content's identity*. Diffing, hashing and deciding what to copy are all
answerable from a digest. The bytes are read solely so that `byteKey`
(`tools/generate/src/store/revision-model.ts:153`) can turn them into a comparable string, one
character per byte — which is both the memory cost and, at ~50 million iterations for LF, the
8.8 seconds of CPU observed on the failing turn.

## Required behaviour

1. Every stored asset has a **content digest** recorded alongside it, established when the
   asset is written and not recomputed on read. `site_assets` already carries `name`, `r2_key`
   and `size`; this sits beside them.
2. **Diffing reads no asset bytes.** `diffSnapshots` decides added / modified / removed from
   digests. An asset whose content changed while its name and size stayed the same is still
   reported as modified — this is the property that makes the comparison worth doing at all.
3. **`snapshotSha` reads no asset bytes.** A revision's `sha` is computed over the listing of
   `path → digest`. It keeps its current properties: a rename is a change, iteration order
   cannot perturb the result, and it is stable for identical content.
4. **Freezing a revision copies no image bytes.** With assets addressed by content, a revision
   is a manifest of digests over immutable blobs. Publishing a site whose images are unchanged
   moves none of them.
5. Re-publishing costs work proportional to **what changed**, not to the size of the site.
6. `byteKey` is retired. No caller reconstructs binary content as a JavaScript string.
7. Publish's memory is **O(largest single asset)**, not O(site). It does not hold two whole
   revisions at once to compare them.
8. Existing sites and existing revisions keep working. Assets stored before this change acquire
   their digest without an operator having to re-upload anything, and revisions frozen before
   this change remain readable and checkout-able. `REVISION_SHA_LENGTH` and the recorded `sha`
   of an existing revision must not be invalidated in a way that makes
   `readRevision`'s integrity refusal fire on data that is in fact intact.
9. The integrity guarantee REQ-266 §4 established is preserved: bytes that disagree with the
   record are still refused rather than served.

## Scope

Content-addressed asset storage is the expected shape and the one the required behaviour above
is written against, but the implementer owns the design. Anything that satisfies 1–9 is
acceptable.

This ticket covers the source-asset path: diff, sha, and revision freezing. **Out of scope:**
the image ladder's accumulation of derived renditions, and its subrequest-based size guard —
those are their own requirement, and the two can land in either order.

Also out of scope: moving publish off the request path onto a Queue or Workflow. That question
is worth asking only once this work shows what memory is actually left.

## Acceptance

- A site with a dozen pages and ten images each publishes.
- Publishing a site with no asset changes reads and writes no asset bytes.
- Peak publish memory does not grow with the number of assets.
- A site published before this change can still be read, checked out, and re-published.
