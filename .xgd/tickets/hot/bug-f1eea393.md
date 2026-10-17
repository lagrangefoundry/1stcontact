---
uid: bug-f1eea393
id: BUG-212
type: bug
title: Builder worker aborted on context budget with no report and left the brief
  half-done
created_by: xgd
created_at: '2026-10-17T22:29:24.149544+00:00'
updated_at: '2026-10-17T23:12:43.145240+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-66e3595b
  commits:
  - working_sha: cf77980434b490511926abfd864919cb0c4ed768
    reconcile_sha: null
    main_sha: null
  - working_sha: bda54fd4ccbc6303c4eb7a44ea74c980714d0957
    reconcile_sha: null
    main_sha: null
  - working_sha: e1cf1fc099c16525fec25692a6029c652c44092c
    reconcile_sha: null
    main_sha: null
  - working_sha: c3377ad7559b74cd48a1eabfc185ced076c63272
    reconcile_sha: null
    main_sha: null
  version: 0.2.522
  story_points: 5
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



## What landed (2026-10-17)

Three commits on `free-BUG-212`, one per part of the fix above. Upstream follow-up: **lagrange-framework BUG-86** (item keys for array params, so `failed`'s shape is declared rather than shimmed here).

1. **Report shape** (`account-core.ts` `reportSchema` / `reportInput` / `reportRefused` / `REPORT_SHAPE_HINT`, applied in `host-core.ts` `toolSet` / `runTool`). The builder's `ReportResult` schema sends `failed.items` with `check` and `reason`, both required strings, `additionalProperties: false`. A `failed` entry that is a plain string, or a lone string instead of a list, is read as `{check: <string>, reason: ""}`. Any `ReportResult` refusal the worker still gets ends with the exact shape and "Call ReportResult again now".
2. **Host summary** (`account-core.ts` `hostSummary`, used in `reportingDelegationToolbox`). When the outcome is not `reported` and the worker's summary is empty, `summary` opens with "The worker did not report; this summary is the host's, from its own records." It then says why the run ended (context budget with occupancy and ceiling, tool-call or time budget with its limit, finished without calling ReportResult, or the recorded status/error), how many tool calls it made and which was last (quoting the refusal when that call was refused), and how many changes it wrote to the draft (pointing at `account.changed`) or that it wrote nothing. A worker's own summary is never replaced. The `summary` result field's description says this.
   - **Supersedes** BUG-167's and BUG-208's "a silent run's `summary` is empty". Those two assertions now expect the host summary.
   - The consultant's out-of-budget paragraph (`turn-clock-core.ts` `workerSummary`) does not quote the host summary as "the worker reported"; it keeps saying why the worker ended without reporting.
3. **Report reserve** (`budget-core.ts` `REPORT_RESERVE_FRACTION = 0.8`, `guardTurn({reserve})`; notice text is `priming.json` template `report-reserve`, filled by `roles.ts` `reportReserveNotice`). Only the builder's guard has a reserve. Once a request's measured occupancy reaches 80% of the room, with the stop at 90%, every following request of that turn carries "Your context is at N tokens, and the host stops this turn at C. Call ReportResult now …". It rides the per-call `signals` channel, composed after any caller-supplied signal, so it is never stored in the dialogue and each request carries it exactly once. The consultant's guard is unchanged.

## Final test plan

`tests/test_UAT_FC_BUG-212_worker_report_survives_its_budget.workers.test.ts` (7 UATs, real route in workerd, Anthropic client scripted):
- the builder is sent `failed`'s item keys;
- a plain-string `failed` entry is recorded with the rest of the report (outcome `reported`, summary and `changed` kept, the quoted check `failed`);
- a report still refused tells the builder the shape to send;
- a builder stopped by the context guard after a refused report comes back with a host summary naming the numbers, the refused last call, and that it wrote nothing;
- a builder that finished without reporting comes back with the exact host summary;
- a builder that reported keeps its own summary;
- a builder inside the reserve is told to report on every following request, not before it, and the notice appears once per request.

Updated assertions: `test_UAT_FC_BUG-167_a_silent_worker_that_only_read_…` and `test_UAT_FC_BUG-208_a_worker_that_never_calls_its_report_…` (the host summary instead of `""`). `test_UAT_FC_BUG-208_a_consultant_turn_that_runs_out_…` covers the out-of-budget paragraph.

Pre-existing failures, identical before this change and not touched by it: REQ-340 ×2, REQ-354 ×2, BUG-167 ×2 (`wrote`/`by` fields), REQ-295 ×2, REQ-379 ×2, REQ-342 (method in tail) ×3, REQ-285 ×6, REQ-341 ×1, AC1320 ×1.