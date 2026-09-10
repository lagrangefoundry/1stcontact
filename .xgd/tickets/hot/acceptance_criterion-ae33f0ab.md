---
uid: acceptance_criterion-ae33f0ab
id: AC-1033
type: acceptance_criterion
title: A definition changed outside the workspace is shown on the next request, with
  no render step and no restart — and two workspaces never share a rendering
created_by: xgd
created_at: '2026-08-10T07:29:13.015523+00:00'
updated_at: '2026-09-10T11:06:52.034015+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A change to a site's definition made anywhere at all — from the command line, or
by editing the stored definition directly — is visible in both draft-side
channels on the next request. Nothing must be re-rendered first, nothing must be
restarted, and nothing on screen has to be told the change happened. Reverting
the definition reverts what is served, on the next request, the same way.

This closes the staleness class that serving stored renderings carried: a change
made outside the workspace's own save path used to be invisible until someone
re-rendered, and a stale page looks exactly like a working one, just older.

Where a rendering is reused between requests, the reuse is held against **the
store the request reads through**, never against the account that store belongs
to. That key is chosen for isolation, not for cost. Two workspaces open at once
therefore each serve their own site's definitions: they are two stores and two
renderings. Keyed on the account they would be one, because every local
workspace is the same notional account, and the first workspace opened would go
on answering for all the others — a whole workspace showing another workspace's
site, which reads as a rendering that simply will not update.

The same key decides *where* reuse happens at all, and it is not everywhere. A
local front door holds one store for a workspace's life, so its renderings are
reused across that workspace's requests. The deployed origin builds a fresh
store per request, so the reuse is never hit and no rendering is reused there;
that is deliberate, because a store held across requests carries an account
check made before the request. What keeps the deployed origin cheap is a layer
lower — the store's own reuse of the assembled definition against the site's
write version — and is asserted there rather than here.

## Verification

Request a draft-side channel and record what comes back. Change the site's
definition outside the workspace — write a distinctive value into the stored
definition directly — and, with no other action, request both draft-side channels
again and assert the new value is present in each. Restore the definition and
request once more, asserting the value is gone: what is served must follow the
definition in both directions, so the assertion cannot pass on a rendering that
was simply produced once and held.

Then open two workspaces over two different stores at the same time, holding
sites whose renderings are distinguishable, and assert each serves its own — the
second must not be answered out of the first's reuse. Drive them under the same
account identifier, since that is the case the account-keyed reuse got wrong and
a two-account probe would pass either way.