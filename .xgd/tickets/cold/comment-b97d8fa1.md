---
uid: comment-b97d8fa1
id: COMMENT-591
type: comment
title: Comment on request REQ-110
created_by: xgd
created_at: '2026-07-30T20:21:39.672571+00:00'
updated_at: '2026-07-30T20:35:23.620302+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-1b56fccd
  kind: chat_transcript
---

<!-- xgd-turn id="e5ac9397-0972-4f80-9ef5-4b19afa92209-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T20:21:37.655430+00:00" -->
#### You
please free code this ticket

<!-- xgd-turn id="e5ac9397-0972-4f80-9ef5-4b19afa92209-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-30T20:35:23.590134+00:00" -->
#### Claude
I'll start by reading the ticket and getting oriented in the codebase.

Now I have the shape. Let me write the deploy module.

Now the snapshot-id and manifest modules.

Now the barrel and CLI wiring.

Now wire the `deploy` verb into the CLI.

The report columns should align and use a repo-relative path. Let me refine the stage model.

Confirmed those 4 failures are pre-existing (identical without my changes). Bumping the version and committing.

Now updating the ticket body with the as-built detail, then moving it to `free_coded`.

REQ-110 is free-coded. `story_points` was already 3, which matches the shipped scope.

## What landed

`1c deploy <slug> [--channel draft|published] [--dry-run] [--prune]` — renders on every run (never trusts `dist/`), content-addresses the snapshot, uploads `out/` + `source/` to R2, and indexes it in a per-site manifest.

New module at `tools/generate/src/deploy/`:
- **`r2.ts`** — the `R2Client` seam. `WranglerR2Client` shells out to `wrangler r2 object` (zero new deps); `MemoryR2Client` is the in-memory fake the UATs drive, so the suite never touches the network.
- **`content.ts`** — `snapshotSha`: sha256 over the canonical `(path, file-sha)` listing, 12 hex chars.
- **`manifest.ts`** — manifest types, read-modify-write, `ManifestConflictError`.
- **`deploy.ts`** — `cmdDeploy` + `formatDeployReport`.

## Two deviations from the spec, both forced by the wrangler CLI

1. **`onlyIf` etag isn't available.** `wrangler r2 object put` has no `If-Match`, so the manifest's lost-update guard is a re-read-and-compare immediately before the write. Narrower race window than a real CAS, not a closed one — but it still fails loudly rather than clobbering, which is the property the ticket asked for.

2. **`wrangler r2 object` cannot list.** R2 lists fine; the CLI doesn't expose it. So `WranglerR2Client` answers `list(prefix)` from a write-ahead key index at `_index.json` in the bucket, populated *before* the first byte uploads. That ordering is what gives `--prune` something to collect: an interrupted deploy leaves keys the index knows and the manifest doesn't. `R2Client.record()` is a named seam so the index can be deleted outright once a client with a real LIST exists.

Both are recorded on the ticket body.

## Verification

Seven acceptance UATs pass (`tests/req110-r2-deploy.test.ts`). `tsc --noEmit` clean across all workspace packages. Full suite: 939 passed, 4 failures — all pre-existing `slot`-leaf fold assertions, confirmed identical on a stashed tree.

Smoke-tested end-to-end with `1c deploy xgd --dry-run` against the real site:

```
  render     storage/dist/sites/xgd/draft   13 files   498.5 KB
  hash       eb3ba04a9350
  upload     preview/eb3ba04a9350/out       13 files   498.5 KB
  upload     preview/eb3ba04a9350/source    11 files   443.7 KB
  manifest   + preview eb3ba04a9350         (basedOn no revision)

  →  https://1stcontact.io/site/xgd/draft/eb3ba04a9350/
```

**Nothing has been uploaded to the `1stcontact-sites` bucket.** A real deploy is outward-facing, so that's your call — say the word and I'll run it. The URL won't resolve until the public-site Worker ticket lands anyway, since it's the piece that reads this layout.

<!-- xgd-chat-end -->