---
uid: acceptance_criterion-41e34bac
id: AC-2357
type: acceptance_criterion
title: --control-origin defaults to the control app when --origin is the 1stcontact
  apex, and no other origin derives a control origin
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T21:10:03.838368+00:00'
updated_at: '2026-11-07T21:10:03.838368+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

When the origin under test is the platform's own apex (`https://1stcontact.io`, the default origin),
the control-origin check runs without being told where the control application is: the control
origin defaults to `https://app.1stcontact.io`, the one route the control application declares
beside that apex. An explicitly supplied control origin overrides the default.

**No other origin derives a control origin.** Pointed at any other origin without a control origin,
the check is skipped naming the control-origin option, rather than guessing a sibling host and
reporting a failing gate for a host that was never the control app.

The platform-default hostname is never derived for any origin: its check runs only when that
hostname is supplied.

## Verification

Run with no arguments: the control-origin check runs against `https://app.1stcontact.io`, and the
platform-default-hostname check is skipped naming its option. Run against the apex with an explicit
control origin: the explicit one is used. Run against another origin with no control origin: the
control-origin check is skipped naming its option, and no request is made to any derived sibling
host.
