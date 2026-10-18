---
uid: bug-997ffa2d
id: BUG-225
type: bug
title: Builder delegations report checks "passed" that are false, and rewrite copy
  outside the brief
created_by: xgd
created_at: '2026-10-18T18:25:15.501272+00:00'
updated_at: '2026-10-18T19:13:48.849700+00:00'
completed_at: null
last_field_updated: epic_parent
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: high
  epic_parent: epic-95bc3b15
  severity: high
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