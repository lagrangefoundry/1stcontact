---
uid: request-eef442dc
id: REQ-469
type: request
title: 'Font publish: parallel, record-diffed upload'
created_by: CHAT-19
created_at: '2026-10-26T03:01:09.852792+00:00'
updated_at: '2026-10-26T04:21:08.739202+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-2ca31110
  commits:
  - working_sha: efae6190e996ebd975ffd7cf1f7725f060d83775
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: c2ae48c04e0e6a6f76c75352ba08a9e09de31e3a
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 761b11c804768e805ef50409dca9d2d65afab13f
    reconcile_sha: null
    main_sha: null
  - working_sha: d94211fdcd3ad1674b55da739fc5f2d186b583ce
    reconcile_sha: null
    main_sha: null
  version: 0.2.666
---

## Problem

A deploy after a mirror change uploads the platform font mirror one object at a time, about a second each. The mirror is 1,931 families: 3,566 woff2 files plus 1,931 licence notices plus the licence index, about 5,500 objects and ~890 MB. A full publish therefore takes ~90 minutes. Observed 2026-10-26, when the 19 Oct re-mirror (`f0d2c38b2d`, the EPIC-19 encoder fix) changed every file's sha256.

There are two causes, both in `tools/generate/src/fonts/publish.ts` (`runPublish`) and repeated in `tools/generate/src/fonts/seed.ts`:

1. **Strictly serial.** Each object is a `HEAD` and then a `PUT`, and the next does not start until the last finishes. Almost all the time is round-trip latency (median file 65 KB), not bandwidth.
2. **Ignores the deploy record's per-object digests.** `platform/fonts-deployed.json` already stores a digest for every object (`mirrorDigests`). `objectsToMove()` uses it to report how many objects will move. The upload then `HEAD`s all ~5,500 objects anyway.

## Required behaviour

- **Record-diffed upload.** When the target holds a deploy record, publish and seed upload only the objects whose digest differs from the record, plus objects the record lacks. Unchanged objects get no request. The number of objects actually moved equals what `objectsToMove()` / `--dry-run` reported.
- **Changed objects are still digest-checked.** An object the record says changed still gets the `HEAD` check before its `PUT`. After a failed run the record still describes the previous mirror, so every object that did land reads as changed. The check lets a re-run skip those instead of sending them twice. On a clean run the count moved equals `objectsToMove()`. On a resumed run it can be lower.
- **Fallback when there is no record.** With no record, or one that is unparseable or cannot be read, the existing per-object `HEAD`-then-skip check stays, so a resumed first publish is still cheap.
- **Bounded concurrency.** Objects upload in parallel with a fixed cap (default ~16). Peak in-flight requests never exceed the cap.
- **Unchanged guarantees:**
  - The deploy record is still written last, and only after every object has landed. It must never describe a partial mirror.
  - A failed PUT still stops the publish with an error saying that re-running resumes. With parallel uploads the error should name the failed key(s); the exact "N landed before this one" count no longer applies.
  - The whole-mirror skip (`platform fonts: unchanged`, one request) is untouched.
- **Transient failures are retried.** Observed 2026-10-26: the publish reached `tomorrow/Tomorrow-MediumItalic.woff2` and died with `INTERNAL: fetch failed`. That is undici's network-level `TypeError`, which had no retry and bypassed `PublishError`, so one blip in ~5,500 requests ended the run. Every R2 request (HEAD, PUT, record read and write) is now retried on a network error, a 429 or a 5xx, with exponential backoff: 4 attempts, 0.5 s / 1 s / 2 s. A failure that outlasts the retries is a `PublishError` (code `ENVIRONMENT`, not `INTERNAL`). It names the key and the underlying error and says that re-running resumes.
- **Seed parity.** `1c fonts seed` (local miniflare R2 stores) gets the same record diff and bounded concurrency, so dev re-seeds are fast too.

## Why free-coded

Small, contained change to two upload loops. The deploy-record machinery it builds on (REQ-412) already exists.

## Out of scope: open product question

102 files over 2 MB make up 467 MB, more than half the mirror. They are CJK variable fonts (ChironSungHK at 20 MB, NotoSerifSC at 12 MB). They cannot reasonably be served to a page unsliced; Google serves them as `unicode-range` slices. Whether to drop them from the mirror or add a slicing step is an operator decision and not part of this ticket.

## Test plan

UATs `test_UAT_FC_<ID>_*` against the real publish/seed entry points. Only the R2 HTTP boundary is faked for publish; a real miniflare bucket is used for seed.
- With a record present and one family changed, only that family's objects are PUT. Zero requests go to unchanged keys.
- With no record, every object is checked and missing or stale ones uploaded. A second run uploads nothing.
- In-flight request count never exceeds the cap, and is greater than 1.
- With an unparseable record, every object is checked as if there were no record.
- When one PUT fails mid-run, the record is not written, the error names the key, and a re-run sends only what did not land, then writes the record.
- A network error followed by a 503 on one key is retried, and the publish completes.
- A network error that outlasts the retries is an `ENVIRONMENT` error naming the key and `fetch failed`, and no record is written.
- Seed: same diff behaviour against a local bucket.

## Implementation

- `tools/generate/src/fonts/publish.ts`: one `deliver(store, manifest, present, missing, onProgress)` loop, written against a small `DeliveryStore` interface (`etags(prefix)`, `put`, `readRecord`, `writeRecord`). It reads the store's record and skips every object whose recorded digest matches `mirrorDigests(manifest)`, without a request or reading the file. If anything is left, it lists `platform/fonts/` once and skips each candidate whose etag equals the MD5 of its staged bytes. It PUTs the rest with at most `UPLOAD_CONCURRENCY` (16) in flight. After the first failure no new object starts. Objects already in flight finish, and every failed key is reported (up to 5 named, then a count). The record is written last, and only when nothing failed and nothing is missing. Objects no longer carry `sha256` metadata, and nothing read it.
- `cloudBucket()` exposes `fetch(key, init)` and `list(query)`. Both go through one shared `Pacer` (a token bucket: burst = 10% of the quota, steady rate = the rest less 5%). It starts at 1,200/300 s and adopts `ratelimit-policy`. 429s are retried while the server's wait is honoured (`retry-after`, else `ratelimit` `t=`, else 30 s), pausing every worker, for up to 10 minutes per request. Network errors and 5xx get 4 attempts at 0.5/1/2 s. `readCloudRecord` goes through the same path.
- `tools/generate/src/fonts/seed.ts`: `runSeed` runs the same `deliver` against each local miniflare bucket through a `localStore(bucket)` adapter (`bucket.list` for etags). `readLocalRecord` reuses the adapter's `readRecord`.
- `1c fonts publish --dry-run` is unchanged and still contacts no bucket. The record-diffed count before a run is what `1c fonts deploy --dry-run` reports as `moves`.

UATs: `tests/test_UAT_FC_REQ-469_font_publish_record_diffed_parallel.test.ts`. Its fake R2 behaves like the real API: `HEAD` returns 405, and listings are paginated with MD5 etags.

## Addendum 2: the HEAD check never worked against real R2 (found 2026-10-26)

- The Cloudflare R2 REST API answers `HEAD …/objects/<key>` with **405 Method Not Allowed**, and a normal GET doesn't return `x-amz-meta-sha256`. So the per-object check above never fired: every candidate read as missing, and every run without a matching record re-sent everything from "a". "Re-running resumes" was not true for the cloud publish.
- What does work: an object's `etag` is the **MD5 of its bytes** (verified on `abeezee/ABeeZee-Regular.woff2`). The bucket can be listed (`GET …/objects?prefix=…&cursor=…`) at up to 1,000 keys with etags per request.
- The endpoint's quota is **1,200 requests per 300 s** (`ratelimit-policy: q=1200;w=300`). A full publish therefore takes about 25 minutes, however much it is parallelised.
- The UAT fake R2 must answer `HEAD` with 405 the way the real API does, so a `HEAD`-based check cannot pass the tests.

## Addendum 3: list-and-compare resume, quota pacing, 429 as back-pressure

Observed after `efae6190e9`: `ENVIRONMENT: 16 object(s) did not land (1695 did): Could not write … (HTTP 429)`. The next run started again at "a".

- **Resume by listing, not HEAD.** The "changed objects are still digest-checked" step above becomes: when any object is a candidate, the delivery lists the destination's font prefix once (paginated) and skips every candidate whose listed `etag` equals the MD5 of the staged file. No `HEAD` is sent, and objects no longer carry `sha256` metadata. Seed lists its local miniflare bucket the same way.
- **Pace to the quota.** Cloud requests pass through a shared pacer that keeps every window of the advertised length under the advertised count. It starts from 1,200 per 300 s and adopts `ratelimit-policy` (`q=…;w=…`) when a response sends one. The burst is about 10% of the quota and the steady rate fills the rest with a 5% margin.
- **A 429 slows the publish down; it does not fail it.** On 429 the request waits as long as the server says: `retry-after` (seconds), or `t=` in the `ratelimit` header, or 30 s if neither is present. The pacer pauses every worker for that time. A 429 keeps being retried for up to 10 minutes per request before it counts as a failure. Network errors and 5xx keep the 4-attempt backoff.

Tests for this addendum (same UAT file): the fake R2 answers `HEAD` with 405 and lists with MD5 etags across pages. Objects already in the bucket with the right bytes are not re-sent when there is no record. A store listed with stale bytes is re-sent. A run of 429s with `retry-after` beyond the old 3-attempt limit completes. Requests stay under a small advertised quota (`q=4;w=1`) in every window. Seed resumes from a local bucket with no record and sends nothing.