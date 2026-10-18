---
uid: bug-3c91a2d9
id: BUG-217
type: bug
title: 'Site editor: friendly ''section being updated'' message instead of builder
  id/UTC'
created_by: martin-github@westhead.me
created_at: '2026-10-17T22:56:15.773287+00:00'
updated_at: '2026-10-18T00:09:54.946149+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-42aa792b
  severity: low
  commits:
  - working_sha: d99598dbca92ea3236dcf65e363abf60b7e3d098
    reconcile_sha: null
    main_sha: null
  - working_sha: cb1db1d21170d9b8de72f4a2af55f0fccff94327
    reconcile_sha: null
    main_sha: null
  version: 0.2.518
  story_points: 1
---

## Symptom

Clicking a section in the site editor while a builder is working on it opens a modal that reads:

> **Being worked on**
> builder worker-builder-7-y326gs is working on this since 22:53 UTC (3 min). You can edit it once that work has finished.

This is shown to the site owner. It leaks an internal worker id, uses a UTC wall-clock time, and reads like a log line.

## Root cause

`GET /api/copy` builds `busy.line` from the operator-facing helpers `describeHolder()` / `heldSince()` (`tools/generate/src/store/leases.ts`). Those helpers are meant for logs and 409 bodies, not for the client. `apps/control-app/src/builder/editor.js` shows the line word for word.

## Fix

- Add a client-facing helper, `busyLine(lease, now)`, to `leases.ts`. It names the holder in plain words and gives a relative time, never an id or a UTC clock:
  - a builder (`worker-*`) or the consultant (`site-*`): "Your AI assistant is updating this section right now"
  - the client's own edit: "You're already saving a change to this section"
  - the system holder: "Another change is being applied to this section"
  - Time: "(started just now)" if under a minute, otherwise "(started N minute(s) ago)".
- `GET /api/copy` sets `busy.line` from `busyLine`. `busy.holder` and `busy.since` stay as they are for programmatic callers, and the 409 refusal on Save does not change.
- The editor modal title becomes "This section is being updated". The message is the line plus "You'll be able to edit it as soon as it's finished — try again in a minute or two."

This supersedes the REQ-397 UAT assertion that `busy.line` starts with `builder <holder-id> is working on this since HH:MM UTC`. That assertion now checks the friendly wording and that the line contains no worker id or UTC clock.

## Test plan

- `tests/test_UAT_FC_BUG-217_friendly_busy_line.workers.test.ts` drives the real `GET /api/copy` over a real D1 lease table:
  - A builder lease backdated 3 minutes gives exactly "Your AI assistant is updating this section right now (started 3 minutes ago)." The line contains no `worker-` id and no `UTC`.
  - A lease taken just now says "(started just now)".
  - A lease held by the client's own save says "You're already saving a change to this section (started just now)."
- Update the REQ-397 copy-save UAT's line assertion to match.
- Regression: the REQ-397 draft-file-leases suite. Both suites pass, 11/11.