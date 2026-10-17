---
uid: bug-f1eea393
id: BUG-212
type: bug
title: Builder worker aborted on context budget with no report and left the brief
  half-done
created_by: xgd
created_at: '2026-10-17T22:29:24.149544+00:00'
updated_at: '2026-10-17T23:01:56.139223+00:00'
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



## Diagnosis (BUG-212 session, 2026-10-17)

- **The report was lost to its shape, not to the budget.** `ReportResult`'s `failed` is a `failure_list` (array of object), and the schema the model is sent is `items: {type: "object"}` with no keys. The declaration cannot give array items keys (upstream `params.js` `wireShape`; acknowledged at `delegation_toolbox.js` `report`). The worker guessed strings, the parameter check refused the **whole** call (summary, `changed` and `passed` with it), and the refusal (`entry 0 must be an object, got str`) never names `check`/`reason`.
- A correct `ReportResult` as the last call would have survived: the report is recorded before the guard ends the turn, and an aborted run that reported stays `outcome: reported`.
- On a non-reported outcome the result already carries `ended`, `activity`, `wrote` and `account` (BUG-167/191/208), but `summary` stays `""`.
- The context guard (`budget-core.ts` `guardTurn`) is a hard stop with no warning: the worker cannot see the ceiling coming, so it cannot save room to report.

## Fix (agreed 2026-10-17) — three parts, this repo

1. **A report the worker can get right first time, and that is not lost to one bad entry.** In the host's tool projection (`toolSet`), `ReportResult`'s schema is sent with `failed.items` declaring `check` and `reason` (both required strings). A `failed` entry sent as a plain string — or a lone string instead of a list — is accepted as `{check: <the string>, reason: ""}`, so it still answers a check whose text it quotes. If `ReportResult` is still refused, the refusal the worker reads ends with the exact shape, so one retry can fix it. The proper fix — item keys in the declaration language, in both languages — is filed as a lagrange-framework ticket; this repo's part is a host-side shim until it lands.
2. **A worker that ends without reporting comes back with a summary written by the host.** When `outcome` is not `reported` and the worker's summary is empty, `summary` is written by the host from its own records and says so: why the run ended (`context_budget` with occupancy and ceiling, `calls`/`time` with the limit, `no_report`, or the recorded status/error), how many tool calls it made and which was last (with the refusal when the last call was refused), and whether it wrote anything to the draft (`account.changed` lists what). The `summary` field's description tells the caller this.
3. **A worker is warned before the context guard stops it.** A builder's guarded backend carries a report reserve: once a request's measured occupancy reaches 80% of the room (below the 90% stop), every following request in that turn carries a host notice — the occupancy, the stopping point, and "call ReportResult now with what you have done and what remains". The notice rides the per-call `signals` channel, so it is never stored in the conversation. The consultant's guard is unchanged.

## Test plan

`tests/test_UAT_FC_BUG-212_*.workers.test.ts`, on the BUG-191 harness (real route in workerd, the Anthropic client scripted):
- The worker's `ReportResult` schema names `failed.items` `check`/`reason`; a report whose `failed` entry is a plain string is recorded (outcome `reported`, summary kept, the quoted check `failed`); a still-malformed report's refusal shows the shape.
- A worker stopped by the context guard comes back with a host summary naming `context_budget`, the numbers and its last operation; a worker that finished without reporting comes back with a host summary saying so.
- A worker whose request crosses the reserve is sent the report notice on its next request; a worker below the reserve is not.