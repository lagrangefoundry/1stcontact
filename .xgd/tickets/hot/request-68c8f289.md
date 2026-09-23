---
uid: request-68c8f289
id: REQ-315
type: request
title: bin/deploy --fonts, and a dev target the font mirror never had
created_by: EPIC-21
created_at: '2026-09-23T23:45:02.265998+00:00'
updated_at: '2026-09-23T23:45:02.265998+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## The tools the font mirror shipped without

[[REQ-312]] built the mirror and [[REQ-313]] taught the assistant to use it, and between
them they left the operator with three separate commands to remember and **no way at all to
reach a local dev environment**.

`1c fonts publish` writes the **cloud** bucket over the R2 REST API. `1c builder` defaults to
local `wrangler dev`, where `env.SITES` is miniflare's own R2 under
`apps/control-app/.wrangler/state/v3/r2/1stcontact-sites/`, which publish never touches. So
after a full mirror and publish, **local builder previews still 404 every platform font** —
the operator is shown a fallback face while the builder tells them they chose Roboto, which
is the exact failure REQ-312's same-origin work existed to prevent, surviving in the one
environment the work is done in.

`bin/deploy` has no fonts step either, so publishing is a remembered command rather than a
deploy target.

## What is asked for

**`bin/deploy --fonts`**, deploying the staged mirror to **dev or production as directed**.

### It is a repo-level target, not a per-app hook

`bin/deploy` iterates apps and there are two that serve `_fonts/…` — control-app and
public-site — but there is **one bucket** and the mirror is not per-app. Running it as a hook
would publish the same 1.35 GB twice; publish is digest-checked so the second pass would
transfer nothing, but it would still re-read and re-hash the whole corpus. `--fonts` runs
once per invocation, before or independently of the app deploys.

### Production is the existing path

`--fonts` at `--env production` is `1c fonts publish` as it stands: the R2 REST API, the
`CLOUDFLARE_API_TOKEN` the release toolset already uses, incremental and resumable. Nothing
about that mechanism changes — this gives it a door in the place an operator already looks.

### Dev is the part that does not exist yet

A local target must land the same objects, under the same `platform/fonts/` prefix and the
same key function, in **miniflare's local R2 state** so that a `wrangler dev` builder serves
them. That state is a SQLite metadata store plus a `blobs/` directory under
`.wrangler/state/v3/r2/<bucket>/`, written directly rather than over a network.

**The local state is per app directory.** `apps/control-app/.wrangler/state` and
`apps/public-site/.wrangler/state` are separate stores, so "the local bucket" is two
locations, not one. Whichever the local target writes, it must be honest about which
surfaces will then answer — seeding control-app alone leaves a locally-served published site
404ing the same fonts the preview beside it renders.

### Shape

- Default `--env production`, matching what the rest of `bin/deploy` already defaults to. The
  local target is selected explicitly; a command that silently wrote a local store when the
  operator meant the cloud would be the wrong way round for a deploy script.
- `--dry-run` reports what would move and moves nothing, on both targets — `bin/deploy`
  guarantees this of every hook and `runPublish` already takes `dryRun`.
- An unstaged or partial mirror refuses and says which objects are missing, rather than
  publishing a mirror that is not one. `PublishReport.missing` already carries this.
- The run reports objects sent, objects already current and bytes — the existing
  `formatPublishReport`, on whichever target ran.

## Why the mirror's cost belongs in the ticket

Measured on this machine, because the numbers decide whether the operator runs this at all
and they are not guessable from the corpus size:

| | |
|---|---|
| Upstream OFL tree | 3,808 files, **2.45 GB** of TTF (REQ-312's own measurement) |
| `sfntToWoff2` at `BROTLI_QUALITY = 11` | **~0.65 MB/s**, single-threaded, consistent across a 1.4 MB and a 15 MB sample |
| So a cold `1c fonts mirror` | **~65 min of brotli**, ~75–90 min wall clock with parse, round-trip verification, hashing and writes |

Brotli's quality cliff sits between 10 and 9, and it is severe — on a 15 MB sample, q11 took
23.6 s, q10 took 10.7 s and q9 took 1.2 s, for output of 4.56 / 4.63 / 4.97 MB. **q9 is
roughly 20× faster for ~9% more bytes**, which for a local dev seed is obviously the right
trade and for a production publish is obviously not.

`--quality` already exists on `1c fonts mirror` for exactly this reason. What is missing is
that nothing tells an operator the cliff is there, so the default silently costs an hour and
a quarter when a dev seed wanted four minutes. Whatever `--fonts` does for dev should not
leave that discovery to the operator.

The mirror is incremental and digest-checked, so this is a one-time cost and a re-run is
near-free — but only if the first run is allowed to finish.

## Out of scope

Mirroring, conversion, the manifest, the projection and the serving paths are all
[[REQ-312]] and [[REQ-313]] and are not reopened here. This is the operator's door onto work
that already exists, plus the one target that was never built.
