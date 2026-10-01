---
uid: request-249ea616
id: REQ-354
type: request
title: 'Delegation: settle containment checks from the host''s own record instead
  of the worker''s budget'
created_by: EPIC-20
created_at: '2026-09-30T20:01:58.591686+00:00'
updated_at: '2026-10-01T19:20:18.856986+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  epic_parent: epic-0923bb64
  created_by: EPIC-20
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-1c8616f5
  commits:
  - working_sha: 04b58a2ea570070666c020e3e16d45a3db026917
    reconcile_sha: null
    main_sha: null
  - working_sha: f50e083d892b8f97c557bbd1deeaf4321a5814c4
    reconcile_sha: null
    main_sha: null
  version: 0.2.426
  story_points: 3
---

## What changes

Checks the host can answer from its own record of what a delegation changed are answered by the host, and never sent to the worker. Today every check is sent to the worker and paid for out of the worker's own tool budget, and some never get answered.

## Why

First live delegation session (Gigabyte Alchemy, 2026-09-29; recorded on EPIC-20): both runs given one five-clause check came back with that check `unreported`, including a run that had done its work correctly. The worker ran out of budget before it verified. Both runs with one-clause checks finished cleanly.

The framework now supports settling checks on the host side (lagrange-framework REQ-188: `claims` / `settle` on the `account` hook). REQ-340 already derives exactly the record needed, a field-level diff of the draft across the delegation. This ticket connects the two.

## Blocked on

lagrange-framework **BUG-78** (`bug-061f71b9`), "Delegation account hooks are called synchronously". Our store is async; until the framework awaits the hooks, `settle` cannot be supplied (see that ticket and `account-core.ts`'s header).

## Behaviour

1. **The host's account is supplied through the framework's hook, not a subclass.** `accountingDelegationToolbox` is deleted. `mark` captures the draft; `changes` returns the same `{from, to, changed}` the subclass returns today. Result shape unchanged for the caller.
2. **The host claims only checks in a small fixed set of phrasings, and never guesses.** At minimum:
   - *page `P` has no changes* — containment of a page;
   - *no element changed any field other than `F1`, `F2`…* — containment of fields;
   - *only the elements at `A1`, `A2`… changed* — containment of addresses.
   A check that does not match one of these exactly is not claimed and goes to the worker unchanged. A wrong claim is worse than no claim.
3. **A claimed check is settled from the diff between the framework's two marks**, `passed` or `failed` with a reason naming what the diff showed (e.g. which page or field broke containment). If either mark failed, the check is reported unsettled, not passed.
4. **Host-settled and worker-reported verdicts are distinguishable** on the result, using the provenance REQ-188 stamps. The consultant must be able to tell a host verdict from a worker's claim.
5. **The consultant is told the phrasings.** The delegation method prose (`templates/delegation-method`) names them as the way to ask for a containment check the host will settle at no cost. Coordinate with REQ-348, which owns the wider briefing guidance.

## Test plan

UATs (`test_UAT_FC_<ID>_*`): each phrasing is claimed and settled pass/fail against a real draft diff; a near-miss phrasing is not claimed and reaches the worker; a claimed check with a failed mark is unsettled; the result carries the host provenance on settled verdicts; the account field is identical to today's with the subclass removed.

## Design decisions (agreed 2026-10-01, before coding)

- **BUG-78 is installed** in the shared `ai` store (hooks awaited), so the async store can supply `mark` / `changes` / `claims` / `settle`.
- **A slim subclass stays, for `wrote` and `activity` only.** No framework hook can add those two BUG-167 fields, and the result shape must not change. The bracket, `changes`, `claims` and `settle` move to `DelegationRuntime({ account })`; the subclass no longer captures anything. `wrote` is derived from the framework's own `account.changed`, so it is present exactly when `account.changed` is. The subclass is renamed to say what it now does; `accountingDelegationToolbox` is gone.
- **`mark` returns the draft's change counter**, so `account.from` / `account.to` stay the integers they are today. The full captures are held host-side, keyed by the framework's per-delegation `ctx` object (the same object reaches both marks, `changes` and `settle`).
- **Phrasings are matched exactly, case-insensitively, whole-string** (surrounding whitespace and one trailing full stop tolerated; list items separated by commas and/or "and"; backticks/quotes around names tolerated):
  - `page <P> has no changes` — passes iff no difference names page `P` (by page id).
  - `no element changed any field other than <F1>, <F2>…` — passes iff every element-level difference (one carrying an `address`) has a field equal to, or nested under, one of the named fields. An added/removed element (field `''`) breaks containment.
  - `only the elements at <A1>, <A2>… changed` — passes iff every element-level difference's address is one of the named addresses, or inside one of them.
  A failed settlement's reason names the first difference that broke containment (page / address / field). A truncated difference list cannot prove containment: it settles `failed` if a listed difference already breaks containment, and is otherwise left unsettled rather than passed.
- **Unsettled on a broken mark** is the framework's behaviour (`settle` is not called without both marks); a capture that is missing host-side when `settle` runs also returns `null` (unsettled), never passed.

## As built

- `tools/generate/src/cli/ai/account-core.ts`: `draftAccount(store, site)` is the `DelegationRuntime({ account })` hook (`mark` / `changes` / `claims` / `settle`); `containmentCheck` parses the three phrasings; `settleContainment` answers them from `draftChanges`. `accountingDelegationToolbox` is replaced by `reportingDelegationToolbox(lib)`, which adds only `wrote` (from the framework's `account.changed`) and `activity`.
- `tools/generate/src/cli/ai/host-core.ts`: the runtime is built with `account: draftAccount(deps.store, slug)`; the delegation surface is the slim subclass.
- `tools/generate/src/cli/ai/priming.json` (`templates.delegation-method`): a paragraph naming the three phrasings with one example each, saying they are settled by the record at no cost to the builder and that any other wording goes to the builder.
- The bracket now opens after the worker's session is opened (the framework's window) instead of just before it. The two enclose the same work.

## UATs

- `tests/test_UAT_FC_REQ-354_the_host_settles_containment_checks.workers.test.ts` (real route in workerd, real D1/R2, only the model client scripted):
  - `each_phrasing_is_settled_by_the_host_and_never_reaches_the_worker`: all three phrasings, held and broken, `by: 'account'`; failure reasons name the page / element / field; none appear in the worker's requests (behaviours 2–4).
  - `a_near_miss_phrasing_is_not_claimed_and_reaches_the_worker`: behaviour 2.
  - `the_account_is_the_same_record_as_before_the_subclass_was_removed`: integer `from`/`to`, field-level `changed`, `wrote` (behaviour 1).
  - `a_claimed_check_without_both_marks_is_unsettled_never_passed`: the host's `settle`/`changes` answer `null` without both captures (behaviour 3).
- `tests/test_UAT_FC_REQ-354_the_consultant_is_told_the_phrasings.test.ts`: the delegation method (both framings) carries the paragraph, and every example in it is claimed by the host's matcher (behaviour 5).
- Regression: BUG-167 (workers) and REQ-340, REQ-342, REQ-343, REQ-295 config (node) pass. The 25 delegation workers suites: three failures in REQ-295/REQ-296 workers suites fail identically on clean `xgd-working` with the reinstalled framework (`by: 'worker'` provenance from REQ-188 not in their expected shapes). They predate this ticket and were not touched here.