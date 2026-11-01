---
uid: acceptance_criterion-72894f27
id: AC-2098
type: acceptance_criterion
title: With no model key configured, the status endpoint says so, the builder shows
  a banner and accepts no input, and every ingestion route refuses with 503 storing
  nothing
created_by: xgd
created_at: '2026-11-01T03:16:55.869646+00:00'
updated_at: '2026-11-01T03:16:55.869646+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6ccaedd5
  kind: behavior
  regression_only: false
---

## Criterion

A deployment that cannot reach a model says so **once, at the top**, and refuses rather than
storing material it cannot describe.

- `GET /api/status` answers `200` with `ai: false` and a message naming the missing model key
  and what to set; with a key configured — or a describer handed in by the host — it answers
  `ai: true` and no message. The answer never contains the key itself.
- The builder, given `ai: false`, shows a banner across the top carrying that message, and while
  the banner is up the rest of the builder accepts no input — upload, publish, palette write,
  description save and chat send are all unavailable. The banner itself stays selectable.
- Both ingestion routes — upload and fetch-on-behalf — refuse with `503` and the same message,
  before reading the request's bytes, and no material, attachment or text comment is created.

## Verification

With no key and no injected describer: call the status endpoint and assert `ai: false` with the
message; POST a file to the upload route and a URL to the fetch route and assert each answers
`503` with the message and that the account's material store is unchanged. Mount the builder
with `ai: false` and assert the banner shows the message, the builder outside the banner is
inert, and the banner is not. Repeat the status call with a key configured and assert `ai: true`.
