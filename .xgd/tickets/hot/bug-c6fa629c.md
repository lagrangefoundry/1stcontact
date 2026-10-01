---
uid: bug-c6fa629c
id: BUG-171
type: bug
title: 'Deploy migrate hook: npm notice after wrangler''s JSON fails D1 migration
  verification'
created_by: martin-github@westhead.me
created_at: '2026-10-01T23:14:14.989510+00:00'
updated_at: '2026-10-01T23:31:40.753713+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-5f09c1b8
  severity: medium
  commits:
  - working_sha: 694fa941386ef7623d519ab557484bc65907dc7a
    reconcile_sha: null
    main_sha: null
  - working_sha: 32e656e1314a83ed8566c90b65d286cd8cf963c0
    reconcile_sha: null
    main_sha: null
  version: 0.2.428
  story_points: 1
---

## Symptom

`bin/dev up` (and any `bin/deploy` of control-app) aborts in the migrate hook
`bin/deploy.d/migrate/10-d1-site-store` with:

    could not read the migrations 'dev' has applied, so none were verified:
      no D1 result set in wrangler output
      [ { "results": [ ...21 migrations... ], "success": true, ... } ]
      npm notice
      npm notice New minor version of npm available! 11.6.0 -> 11.21.0

The wrangler query succeeded and its JSON result is well-formed; the deploy is
refused anyway.

## Root cause

The hook runs `npx wrangler d1 execute ... --json 2>&1`, merging stderr into
the captured output. npm's update notice is written to stderr *after*
wrangler's JSON. `appliedFrom()` in `bin/migration-manifest` tries
`JSON.parse(stdout.slice(i))` from each `[` to the **end of the output**, so
any text after the document — here the `npm notice` lines — makes every
candidate fail to parse. The REQ-291 parser was hardened against chatter
*before* the document (`▲ [WARNING] Proxy ...`) but not after it.

Reproduced offline: piping the same JSON with the two trailing `npm notice`
lines into `node bin/migration-manifest verify --env dev --status 0` exits 1;
the same JSON without them exits 0.

## Fix

`appliedFrom()` finds each candidate document as a bracket-balanced span
(string- and escape-aware) starting at a `[`, and parses only that span, so
chatter before or after the document is ignored. Still the first span that has
the shape of a D1 result set wins; output with no such span still fails
("an unreadable environment is not a pass" is unchanged).

## Test plan

Extend the REQ-291 hook harness (`tests/support/migrate-hook.ts`) with chatter
written to stderr *after* the JSON document, and add
`test_UAT_FC_BUG-171_*` cases that run the shipped hook against the shipped
`bin/migration-manifest`: trailing npm notice → verification passes and
migrations are applied; trailing notice with a drifted applied migration →
still refused. Regression scope: the REQ-291 test file.