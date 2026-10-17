---
uid: bug-f1eea393
id: BUG-212
type: bug
title: Builder worker aborted on context budget with no report and left the brief
  half-done
created_by: xgd
created_at: '2026-10-17T22:29:24.149544+00:00'
updated_at: '2026-10-17T22:47:51.652538+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-66e3595b
---

## What happened
I delegated a large single-page build to a `builder` worker: about 10 sections, a palette, text styles, a contact-form component, and 6 image crops from one source asset. Scope: `site.json`, `home.json`, and 6 `assets/*.png` files. The worker made 79 operations, then ended with `ended.reason: "context_budget"`, `status: "aborted"` (occupancy 152,499 against a 151,200 ceiling).

- `outcome: "silent"` and `summary: ""`. All 7 `accept` checks came back `unreported`.
- Its last operation was a failed `ReportResult` call: `"ReportResult parameter 'failed' entry 0 must be an object, got str"`. So it did try to report, but used the wrong shape, and its budget ran out before it could retry.
- `nudge_skipped`: no second ask was made, because the turn was aborted.
- The `account` record shows the page and site.json changes landed. None of the 6 image crops were created; every picture element still pointed at the uncropped source asset.

## Expected
- The worker reserves enough budget to report back, or the host writes a partial report from the account when a worker aborts.
- A `ReportResult` schema error is either explained to the worker clearly enough to fix in one retry, or accepted in a looser form (e.g. a plain string in `failed`).

## Impact
The caller has to rebuild the picture itself from `describe_page` and screenshots, which moves the token cost back onto the expensive side. Half-finished work (uncropped images, 5 "broken" attention items, sections out of order) was left on the draft without any explanation.

## Repro
Delegate to `builder` a goal with roughly 10 sections of rich copy, plus a component, plus multiple asset derivations, in one brief with 7 accept checks.



## Relation to BUG-208 (EPIC-19, 2026-10-17)

Not a duplicate. BUG-208 covered workers ending on the call or time budget, and a report written as prose. This one is the `context_budget` abort, where the worker **did** call `ReportResult`, with a wrong-shaped `failed` entry, and had no budget left to retry. Two fixes:

1. **`ReportResult` accepts a plain string** in `failed` (coerced to an item) instead of refusing. A refusal at the last step of a budget-limited turn is a lost report. If the shape lives upstream, this half is a lagrange-framework ticket.
2. **On a `context_budget` abort the host writes a partial report from the account** — what was written, what wasn't — instead of an empty summary.

The brief itself (about 10 sections, a component, 6 crops and 7 checks in one) is the kind DOC-63 says to split. EPIC-24's per-section scopes make smaller briefs the natural unit.