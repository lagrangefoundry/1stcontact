---
uid: bug-0c4ebd4d
id: BUG-252
type: bug
title: 'Delegate result: the change account reaches the consultant at up to 54 KB'
created_by: EPIC-20
created_at: '2026-10-22T23:07:13.566229+00:00'
updated_at: '2026-10-23T00:35:41.235563+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-6dacd691
  commits:
  - working_sha: 903d06c2485a9f28d91ba9cd3bdef992faa50358
    reconcile_sha: null
    main_sha: null
  - working_sha: 6591f2580f463ee736fe08e58ab4279f5bcd0a4d
    reconcile_sha: null
    main_sha: null
  version: 0.2.584
  story_points: 3
---

## Symptom

On Ariel's Arc Welding (2026-10-21/22, about $52 total), the consultant's Delegate results were the largest single thing it read. Over 85 Delegate calls they came to **1.07 MB** of tool results: median 9.3 KB, the largest 54 KB, and 16 over 20 KB. Each one is written to the consultant's cache at the Opus 1-hour rate ($8/M) and then re-read on every later request until it is trimmed.

The 17 delegation turns were **$17.46 of the consultant's $27.92**, with **982k tokens of cache writes** ($7.86). The non-delegation turns averaged about $0.09 each.

## Root cause

`draftChanges` (`tools/generate/src/cli/ai/account-core.ts`) caps the account's `differences` list with `DIFFERENCE_BUDGET = 24_000` characters and `DIFFERENCE_LIMIT = 200` entries. Both are generous by design ("an ordinary run never meets it"). Two things make the real result much bigger than the budget suggests:

1. The budget is measured on **canonical (compact) JSON**, but the result goes out pretty-printed (framework `toolbox/provenance.js:128`, `JSON.stringify(…, null, 2)`). With nesting that deep, a 24k-character budget arrives as about 53 KB.
2. Each difference carries full `before` and `after` values. A builder restyling a page lists every field, font `src` and text block it touched, so the consultant gets a field-by-field diff it does not need in order to judge the run.

## Fix

The consultant needs to know what was accepted, what changed and where, and whether anything went outside scope. It does not need every before/after value.

- Bound the Delegate result **as sent**, not as canonical JSON. Count the serialised size the model actually receives, with a budget of a few thousand characters (about 6k), not 24k.
- Past a small number of entries, **summarise by place**: page → element address → the fields that changed, with no before/after values. Keep `truncated` so the consultant knows to look (`list_changes`, a screenshot) when it needs detail.
- Out-of-scope and other-actor differences (`others`, BUG-225, and scope breaches) always keep their detail. Those are what the consultant has to act on.

The pretty-printing itself is a framework concern: see the framework ticket filed alongside this one. This ticket does not depend on it.

## Test plan

- UAT: a builder run that changes a whole page (many fields) produces a Delegate result whose serialised size, as the consultant receives it, is under the new budget. It still names every page and element touched and reports `truncated`.
- UAT: an out-of-scope difference is always reported with its detail, even when the budget is exhausted.
- Re-measure on the next test site: the median and maximum Delegate result size, and cache writes per delegation turn.


## What changed (as implemented)

The Delegate result's `account.changed` is now bounded **as the consultant receives it**. The host's own record is unchanged.

- **New step `presentedChanges(changed, scope)`** (`tools/generate/src/cli/ai/account-core.ts`), applied once, last, to the Delegate result as it leaves `reportingDelegationToolbox.delegate()` (both the single-run and the replaced-run return). It runs after `wrote`, the host summary and a replacement builder's brief have been read off the whole record.
- **Budget as sent.** `ACCOUNT_BUDGET = 6_000` characters, measured as `JSON.stringify({ account: { changed } }, null, 2)`. That is the indented rendering the framework sends, at the depth the account sits in the result.
- **A short list goes as it is.** That means at most `ACCOUNT_DETAIL_LIMIT = 12` builder differences, and the whole account within the budget.
- **Otherwise the builder's in-scope differences are summarised by place** into a new `places` list. One entry per page (and component instance/slot), asset, or `site.json`. `elements` maps each changed element's address to the fields that changed on it (`created`/`replaced`/`removed` when the element itself is the change), `fields` lists the page's own fields, and `changes` counts the differences at that place. No before/after values are sent. `truncated` counts every difference not sent one by one, plus any the record itself had already cut.
- **If even the places do not fit**, each gives way in turn: `elements` becomes `addresses` (addresses only), then the addresses are dropped (`changes` only), then places are dropped from the end.
- **Never summarised:** `others` (another actor's edits, BUG-225), and the builder's differences outside the delegation's `scope`. Both stay in full, with values, even when the budget is spent.
- The `wrote` result-field description now tells the consultant how to read `places` and `truncated`, and where to get values (the page, or `list_changes` between `from` and `to`).

## Design decisions made during implementation

- **The host's record keeps its values.** `draftChanges` and its `DIFFERENCE_BUDGET`/`DIFFERENCE_LIMIT` (24k compact / 200) are now documented as bounding the host's record, not the conversation. Host-settled containment checks and a replacement builder's brief both need the detail. So the summary is applied only to what is sent, not inside `draftChanges` or the `changes` hook.
- **Scope is matched by file.** A difference on page `p` is in scope when `scope` names `p.json` or any `p.json#…` (section or style). Assets match `assets/<name>`, and `site.json` matches itself. No scope at all means everything counts as in scope. Finer section-level breaches are already refused by the store's leases (REQ-397). The one out-of-scope builder difference that can actually happen is a file the builder **created**, which leases allow (e.g. `add_page` with `site.json` in scope creates `services.json`).
- `places` was added as a new field rather than changing the shape of `differences`, so a short result reads exactly as before.

## Measured

The UAT's builder restyles 30 bands (90 field changes) and adds a page. Its account as sent was **21,706 characters before this change and 1,925 after**. The whole Delegate tool result went from 22,057 to 2,276 characters.

## UATs

- `tests/test_UAT_FC_BUG-252_the_account_is_bounded_as_sent.workers.test.ts`: through the real `POST /api/ai/prompt` route in workerd (real D1 store and leases, real `set_l1`/`add_page`; only the model client is scripted). It checks four things. The account in the tool result the consultant's next request carried is within `ACCOUNT_BUDGET`. No restyled value appears in it. Every one of the 30 elements is named with its changed fields, with `truncated` ≥ 90. The page created outside scope is sent whole.
- `tests/test_UAT_FC_BUG-252_what_the_caller_acts_on_keeps_its_detail.test.ts`: the real `draftAccount` hook (marks, comparison, journal set-apart) over a memory store, with edits made as the builder (`ai`) and as the client, then `presentedChanges` with `scope: ['home.json']`. The out-of-scope `site.json` change keeps its values, and the client's edit is in `others` with its values and actor, even though the home restyle spent the budget.