---
uid: acceptance_criterion-53027481
id: AC-548
type: acceptance_criterion
title: Conformance check renders a module in isolation through the real catalog renderer
  with no site-data pollution
created_by: xgd
created_at: '2026-07-10T00:14:54.523979+00:00'
updated_at: '2026-07-10T00:14:54.523979+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a6962b23
  kind: behavior
  regression_only: false
---

## Criterion
Running the conformance check on a module id plus a well-formed fixture produces a page, reachable over a loopback URL, that contains **exactly one** rendered module section produced by the real catalog renderer (the same token/stylesheet pipeline shipping sites use — the catalog stylesheet is present and the fixture's authored content appears). Each fixture renders and serves under its own throwaway store root, never the real site storage, so a conformance run cannot read or mutate any real site's data; the store root is removed on a clean pass.

## Verification
Serve a well-formed real-module fixture and assert: the served URL is a loopback address; the page contains exactly one module band; the page carries the catalog stylesheet and the fixture's content marker; and the backing store root is an isolated temporary directory that is cleaned up after a passing run.
