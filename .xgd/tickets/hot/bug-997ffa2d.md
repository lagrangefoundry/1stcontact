---
uid: bug-997ffa2d
id: BUG-225
type: bug
title: Builder delegations report checks "passed" that are false, and rewrite copy
  outside the brief
created_by: xgd
created_at: '2026-10-18T18:25:15.501272+00:00'
updated_at: '2026-10-18T19:38:05.965365+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-e5682ad7
  commits:
  - working_sha: 1a9ffc20b0a8a6439ba1c6b5ffc6d56000f82fed
    reconcile_sha: null
    main_sha: null
  - working_sha: ba3d1a5523bc5bd737d7b43d2965aedd66c783d7
    reconcile_sha: null
    main_sha: null
  version: 0.2.535
  story_points: 5
---

## What happened
Across a chain of `Delegate` calls (role: builder) on one site, I saw these failures:
1. **A false pass on structure.** The first build was asked to add a hero section with an exact headline. The worker reported `passed` on "the hero headline reads exactly …". `describe_page` showed no hero section and no such text anywhere on the page.
2. **Out-of-scope copy rewriting.** A later delegation was briefed to fix only the header layout ("Don't change any wording"), with the checks "page X: only elements inside the header section changed". The worker reported `passed`. The host account showed it had rewritten around 15 text elements in other sections of another page, inventing claims (prices, policies, statements of fact) that appear nowhere in the source document it was told to follow.
3. **Confusing attribution on a failed check.** In a later delegation, an `account`-settled check failed with "field src changed on page home". `list_changes` attributes that change to `actor: client` (the client edited the logo while the worker ran), yet the change appears inside the worker's account diff.

## Expected
- Worker-settled checks should not report `passed` when the condition is plainly false on the page. A check about text content or containment should be settled from the record, never from the worker's belief.
- A containment phrasing close to the canonical one ("only elements inside the header section changed") should either be settled by the host or rejected as un-settleable, not passed to the worker to self-certify.
- The account diff should exclude, or clearly label, changes made by other actors (the client) during the delegation window, so a failed check is not blamed on the worker.

## Reproduce
1. Delegate a layout-only fix with a brief that says "don't change wording" and a check worded as a section-scoped containment check, not the exact canonical form.
2. Read the result's `account`: text changes outside the scope show up while the check reads `passed` (`by: worker`).
3. While a delegation runs, have the client edit any field. The account diff includes it, and an account-settled check fails against the worker.

## Impact
The consultant cannot trust worker verdicts and has to re-inspect, which defeats the cost model of delegation. Invented copy reaching a client's draft is a trust and accuracy risk.



## Notes (EPIC-19, 2026-10-18)

Three separate defects; two are ours and confirmable, one is partly fixed already.

1. **False pass on text content.** A check like "the hero headline reads exactly …" is answered by the builder from belief. The record of what changed could settle it instead: add a host-settled check form, e.g. *"page home contains the text '…'"*, answered from the assembled page after the run, beside the existing containment forms. Teach it in `delegation-method`.
2. **Rewriting copy outside the brief.** In Bob's salon 2 the 18:36 builder was scoped to `["home.json","prices.json"]`, whole pages, so every section of both was in scope and the lease could not refuse the rewrites. Section scopes (`home.json#header`), now taught in the prompt (`1c44ce9957`) and made mandatory by REQ-410, would have refused them. Separately, a near-canonical containment phrasing ("only elements inside the header section changed") should be recognised as section containment and settled by the host, or refused as unsettleable, never passed to the builder.
3. **The client's own edit counted against the builder.** The account diff compares the site before and after, so a client edit during the run lands in the builder's account and fails its checks. `list_changes` already knows the actor. The account should exclude, or label as the client's, any change whose actor is not the builder, and account-settled checks should judge only the builder's changes.

Related: BUG-218 (report written as text) is abandoned; the false-pass pattern here is the reason delegation's cost model fails, so this ticket carries it.



## Fix (scope agreed for free-coding)

Free-coded: three host-side changes to the existing account/check machinery (`account-core.ts`), with no new subsystem.

1. **Host-settled text checks.** New forms the host claims and settles from the page as it stands after the run, never sent to the builder:
   - `page <P> contains the text '<T>'`
   - `page <P> does not contain the text '<T>'`
   - either one scoped to a section: `section <S> on page <P> contains the text '<T>'`
   A match is made within one text node's words (`l1PlainText`), across the page's own tree and its component slots. Whitespace is collapsed and curly quotes are read as straight ones; case matters. A failure says what the page or section holds instead (when it holds no such text) or where the text appears (for "does not contain").
2. **Section containment.** A new canonical form, `only the elements in section <S> on page <P> changed`, plus near phrasings of it the host also claims: `[page <P>:] only (the) elements inside/in/within the <S> section changed`, `only the <S> section (on page <P>) changed`. An element is inside when it sits at the section's address (the root child whose id is `<S>`) or beneath it, or inside a component whose slot that section hosts. A page's own fields and its style are outside. A section the page does not have fails, naming the sections it has.
   **Un-settleable checks are refused.** Before a builder is opened, `Delegate` refuses (`unsettled_check`, nothing runs, nothing is spent) any check that reads like containment ("only … changed") or like a text claim (it quotes words and talks about text, a heading, reading or saying) but is not one of the host's forms. The refusal names the checks and the forms to use.
3. **Other actors' changes are set apart.** The account reads the change journal between its two marks. A difference falls to another actor (`client`, `cli`) when the journal shows only that actor writing its page in the window, or, where both wrote the page, when that actor's record names the element (or one above it) and no builder (`ai`) record overlaps it. Such differences move out of `account.changed.differences` into `account.changed.others`, each carrying its `actor`. `wrote`, the host's summary and every account-settled check judge only the builder's differences. A difference the journal cannot place stays with the builder. With a truncated journal nothing is set apart.

The consultant's delegation method (`priming.json` → `delegation-method`) teaches the new forms and the refusal. The `wrote` field's prose names `account.changed.others`.

## Test plan

`tests/test_UAT_FC_BUG-225_*.test.ts`:
- a text check is settled by the host, passes and fails on the real page, and never reaches the builder;
- the section-containment form and its near phrasing ("page home: only elements inside the header section changed") are claimed and settled: a write outside the section fails it;
- a containment-like or quoted-text check the host cannot settle is refused before any builder runs;
- a client edit landed during the delegation is listed under `account.changed.others` with `actor: client` and does not fail an account-settled check;
- the delegation method names each new form, and the host claims every example it shows.
Regression scope: the REQ-354, BUG-219, REQ-340/361 account suites and the delegation-method prompt suites.



## Verification (2026-10-18)

Landed as `1a9ffc20b0` (plus the gate's version bump `ba3d1a5523`), merged into xgd-working. Both BUG-225 UAT files pass: 5 host-hook cases and 2 cases through the real route inside workerd. The regression scope is 31 files and 206 tests: everything passes except 6 tests in `REQ-295_delegation.workers`, `REQ-342_the_method_rides_every_turn.workers` and `REQ-295_delegation_config`. All 6 fail the same way with this change's two source files reverted to xgd-working `5cb1a3b543`, so they are pre-existing and not caused by this change.

Known limit: a journal address is the one each write was made at, so a client edit to an element the builder later moved, or to one the builder also wrote, stays in the builder's account. Attribution only ever narrows the builder's share.