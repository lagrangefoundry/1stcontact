---
uid: bug-5a82ab2b
id: BUG-327
type: bug
title: 'Publish: a storage read error fails the publish with no record of where, and
  the builder can''t tell you the draft differs from the live site'
created_by: EPIC-19
created_at: '2026-11-01T16:09:46.324924+00:00'
updated_at: '2026-11-01T17:31:32.650746+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-38847aec
  story_points: 5
  commits:
  - working_sha: b217ff0f75d370c3183912e0c5e65881896d6457
    reconcile_sha: null
    main_sha: null
  - working_sha: d147fc9ef9af50cb7f53f4e14b5658b29ac27974
    reconcile_sha: null
    main_sha: null
  version: 0.2.726
---

## Symptom

Production, 2026-11-01, the 1st Contact site (`site_c4bed79aeb647305a5e3098f70d6dca3`, business `biz_51a6746495c8057e886ff98d4208e6b9`). Publish failed twice, at 15:45:22Z and 15:45:37Z (`POST /api/publish` → 500, 2.7 s and 4.7 s). The builder said: "This site was not published. Something went wrong — try again in a minute, and tell us if it keeps happening." Details: `get: We encountered an internal error. Please try again. (10001)`. That's the shape of an R2 binding error on a `get`.

Also (operator): "I feel like we need an indicator that tells me if the preview draft differs from the published site."

## What was checked

- Our logs record only the 500: `log_records` has the request with no data, and Workers Logs have the request line, no exception, no stack, no key. The error text exists only in the client's "Details".
- Every R2 object the publish reads reads fine from outside (wrangler, read-only): the 14 asset blobs (`sites/<site>/blob/<digest>`, including the 598,799-byte `hero-smoke-loop.mp4`), and the only published revision, `0001` from 2026-10-10 (`source/site.json`, `source/assets.json`, `source/pages/home.json`). So it isn't a missing or corrupt object.
- Cloudflare's status page shows no R2 incident at the time.
- **Confirmed transient:** the operator pressed Publish again later on 2026-11-01 and it succeeded with no change to the site. Fix 2 (retry R2's internal errors) would have absorbed both failures.
- So the read failed transiently inside the Worker (R2's 10001 is its retryable internal error), or on a key not in that list. Without a logged key we can't tell which.

## Fix

1. **A failed publish leaves a record of where it failed.** Log the step (draft read, previous revision read, ladder, render, revision write), the R2 key or asset name, and the error, with the request's trace id, to `log_records` and Workers Logs. Never in the client's message.
2. **Retry R2's transient errors.** Reads and writes inside the publish retry a failed R2 operation that reports an internal error (10001, or a 5xx) a few times with a short backoff before failing the publish. A deterministic failure still fails, with the step named for the operator.
3. **Draft vs live indicator.** The builder shows, beside Publish, whether the draft differs from the published site: "Published, up to date", or "Unpublished changes" with a count, and the list of what changed (pages, sections, pictures, settings) one click away. It uses the same change list the publish computes (`changes` / `basedOn`), as a read-only dry run. It updates when the draft changes and after a publish. A site never published says "Not published yet".

## What landed

1. **Where a publish failed is logged.** `publishSite` names the step that was running on whatever it throws — `draft read`, `previous revision read`, `address check`, `ladder`, `render`, `revision write` — and an asset read names the asset. The D1/R2 store notes the R2 key (or listing prefix) and how many attempts were made. The `/api/publish` route (JSON and streaming forms) writes one `publish.failed` record at `error` to `log_records` and Workers Logs, under the request's trace id: `site`, `step`, `key`, `asset`, `attempts`, and the scrubbed error. The client still gets the error's own sentence, and it never contains the key. A refusal (no address, invalid draft, nothing built, ladder ceilings) is an answer, not a failure, so it isn't logged here. The notes sit in a side table keyed by the error object (`tools/generate/src/store/storage-failure.ts`), so the error keeps its class and refusals still map to their codes.
2. **R2's transient errors are retried.** Every R2 call the D1/R2 site store makes (`get`, `head`, `put`, `delete`, `list`) is retried when R2 reports a transient error: code `(10001)` (internal), `(10043)` (unavailable) or `(10058)` (too many requests) in the message, or a 5xx `status`. It retries 3 times, waiting 100, 300 and 900 ms. Any other error fails at once, with its step and key logged as in 1. A `put` of a stream isn't retried because a stream can't be replayed, and the store never does one. This covers the whole store, not just publish: the publish reads through it, and wrapping the bucket once is simpler than a second retry path.
3. **Draft vs live indicator.** `GET /api/publish/status?site=` answers `{ live, basedOn, changes }`. It's the publish's own comparison (the same `draftAgainstLive` helper `publishSite` uses, so `diffSnapshots` over the live revision and the draft snapshot) run as a dry run that writes nothing. The builder shows a `publish-status` control right after Publish, in View and Edit:
   - "Not published yet" when there's no live revision.
   - "Published, up to date" when the change list is empty.
   - "Unpublished changes (n)" when it isn't. That one is a `<details>`: clicking it lists each change as `Page <name> — changed`, `Picture <name> — added`, or `Shared settings (colours, fonts, menu) — changed` for `site.json`.
   The control refreshes on every draft-feed frame, on a site switch, and after a successful publish. Reads that overlap collapse into one more read.

## Design decisions made during implementation

- **Sections aren't listed separately.** The change list the publish computes is per file (page, picture, `site.json`). A section edit therefore shows up as a change to its page. A section-level diff would be a second comparison that could disagree with the publish.
- **`site.json` reads "Shared settings (colours, fonts, menu)", not "Settings".** The Settings tab's label may only appear as a literal in `config.js` (REQ-239), and this isn't that tab.
- **The existing toolbar-lifetime UAT (`reconciliation-builder-toolbar-lifetime.test.ts`, AC970) lists every View control by hand.** It now includes `publish-status` after `publish`. This is a deliberate addition to the strip.

## Test plan

- `test_UAT_FC_BUG-327_publish_failure_logged`: an R2 `get` that throws on one key during publish yields a 500 whose `log_records` entry names the step and the key, and the client's message doesn't contain the key.
- `test_UAT_FC_BUG-327_transient_r2_error_retried`: an R2 `get` that throws a 10001 error once, then succeeds, still publishes.
- `test_UAT_FC_BUG-327_draft_differs_indicator`: after a publish the indicator reads up to date; a draft edit makes it read "Unpublished changes" with a count of 1 and that change listed; publishing again returns it to up to date.
- `test_UAT_FC_BUG-327_draft_differs_indicator_follows_edits_and_publishes` (jsdom, the real `mountBuilder` toolbar reading through `api.js` over a fake origin): the same sequence in the builder, including the change listed as `Page home — changed`.
- `test_UAT_FC_BUG-327_a_site_never_published_says_so` (jsdom): a site with no live revision reads "Not published yet".
- The first three are in `tests/test_UAT_FC_BUG-327_publish_failure.workers.test.ts`, run in workerd against real D1 and R2 through the Worker's `fetch`. The only stand-in is a proxy over the real bucket that throws on one key. `draft_differs_indicator` there checks the endpoint: null live, then empty, then `modified: ['pages/<name>']`, the status read writes nothing, and the next publish records exactly that change.