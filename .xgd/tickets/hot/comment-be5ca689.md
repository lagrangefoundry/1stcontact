---
uid: comment-be5ca689
id: COMMENT-2176
type: comment
title: Comment on request REQ-178
created_by: xgd
created_at: '2026-09-02T23:36:47.610835+00:00'
updated_at: '2026-09-05T00:25:17.645904+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-407a6fd8
  kind: chat_transcript
---

<!-- xgd-turn id="dacaf444-bfbb-4fa5-aa5d-cd8dfb140c94-user" -->

<!-- xgd-chat role="user" ts="2026-09-02T23:35:59.198610+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="dacaf444-bfbb-4fa5-aa5d-cd8dfb140c94-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T00:03:50.278616+00:00" -->
#### Claude
The ticket is detailed enough to implement. Let me start the free-coding flow.

Baseline green. Now the implementation.

Now the provisioning split:

Full suite: the one failure is pre-existing and unrelated. Now recording the implementation in the ticket:

No stale readers. Waiting on the `xgd-working` merge lock — REQ-175's session holds it mid-merge.

Lock released. Merging back:

Done. REQ-178 is at `free_coded` with both commits recorded.

## What landed

**`apps/control-app/src/identity.ts`**

- `Admission` now carries `businesses: AdmittedBusiness[]` — `{ accountId, name, entitlement, selectable }` — and the singular `accountId`/`entitlement` are **deleted**, not kept alongside. A call site left reading one would serve whichever business sorted first to someone who picked the second; deleting makes that a compile error. `index.ts` reads `ok` alone, so nothing needed rewiring.
- `businessesFor` replaces `accountFor`: every live membership, inner-joined onto `tenants` for the label, each resolved through `bestActiveGrant` independently. Revoked/expired memberships are excluded outright (a withdrawn membership is not a lapsed grant); a lapsed *grant* stays in the list with `selectable: false`.
- Denial moved down. `no_membership`/`no_entitlement` now mean *none of them*; person-level refusals keep their precedence.
- `provisionBusiness(env, { accountUserId, name, … })` extracted, and `provisionInvite` calls it.

**Tests** — `tests/test_UAT_FC_REQ-178_businesses.workers.test.ts`, 10 UATs in workerd against real D1. Two REQ-167 UATs updated for the new shape. Workers project: 26 files / 217 tests green on `xgd-working`. Full suite has one pre-existing unrelated failure (`bug32-webui-scope-rebrand`, fails identically on the base commit).

## Two things you should know

**1. A judgement call I made and recorded in the ticket.** Extracting `provisionBusiness` splits the old three-row `DB.batch()`: the user row is now written alone, and membership + grant batch together. That newly admits a person with no business. It's visible (`no_membership`) and I made it repairable — re-inviting someone who holds no live business provisions one. If you'd rather that stayed a refusal, it's a small change.

**2. Another session committed a broken merge, and I repaired it.** While `free-REQ-178` was merging into `xgd-working` (conflict on the `package.json` version scalar only), REQ-175's session ran `git commit` inside my conflicted merge. It committed the merge as `6cddcbb1c4` — labelled *"chore(version): bump to 0.2.50 for REQ-175"* — with the conflict markers still in `package.json`. Every other path merged clean, but `package.json` was unparseable on `xgd-working` from 17:00 until I fixed it in `68db393777` (resolved to `0.2.51`, above both sides). That commit is recorded on this ticket with an explanation, since there was nowhere else for it to go — but the race itself is worth looking at: `xgd branch lock` was held by me, and REQ-175's session committed anyway.

<!-- xgd-turn id="68cfb4ac-242c-4e04-b5ae-cba05eedfc30-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T00:01:33.472077+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="68cfb4ac-242c-4e04-b5ae-cba05eedfc30-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-05T00:25:17.031366+00:00" -->
#### Claude
Now the implementation. First `identity.ts`:

Now `scope.ts` — resolution has to be able to answer "no business":

Now the router — a null scope must reach the scope-free routes and refuse the rest:

Now `index.ts` — the log line and the 403:

Now the UATs. Let me look at the existing REQ-178 suite's harness:

Now the end-to-end suite for what an admitted-but-lapsed session actually reaches:

Now the full workers project plus the broader suite:

Now merge back:

Now put the REQ-184 test fix and the version resolution on the branch as their own commit:

Now the follow-up commit carrying the REQ-184 UAT fix and the version bump:

Now record the commits and release the lock:

Done. REQ-178 is at `free_coded` with all four commits recorded.

## What the amendment changed

`admit` no longer refuses `no_entitlement`. Membership admits; entitlement decides which businesses are *selectable*. That one deletion made "no business to be in" a reachable state, and everything else is the consequence of handling it:

- **`resolveScope` returns `Scope | null`.** `firstAdmissible` used to throw an invariant error on exactly this state — left alone, it would have turned every request from a lapsed customer into a **503**, a configuration failure shown to the one person whose problem is a payment.
- **`route` takes a nullable scope**, still required, no default. One `requireScope()` inside the table throws `NoBusinessError`, and every business-needing route already reaches it through three memoised openers plus `chatHost` — so the null is handled once and a route added later can't forget it. The routes above the store keep answering: the chrome, `/api/status`, `/api/businesses`. That set is the point, not a side effect — **the chrome draws the switcher, and the switcher is the only surface that says why each business is closed.**
- **403 with its own message**, not `DENIED_MESSAGE`. Nobody reaches it without a live membership, so it's a fact about the reader's own account. `no_entitlement` survives as a `DenialReason` because `index.ts` logs it there — the state still matters to an operator, it just no longer refuses.
- **No client change was needed.** `resolveBusiness` already returns null and `selectBusiness(null)` already swallows the site-list failure — REQ-179 built that path for browser storage outliving a grant. Asserted end-to-end through the Worker rather than assumed.

## Two things worth knowing

**1. Five existing UATs lost their observable, and I moved rather than deleted them.** Four in REQ-167 proved things about the grant *window* (end date passed, start date future, revoked status) using admission's refusal; they now assert on the business's `selectable`. The fifth is REQ-167's oracle claim — two refusals must be byte-identical — which I re-drove with a *withdrawn membership* against a stranger, since `no_membership` vs `no_user` is exactly the pair an existence oracle would distinguish. A sixth, in REQ-184, needed the same move.

**2. That sixth fix is its own commit, deliberately.** REQ-184 landed on `xgd-working` after my branch was cut, so its test file doesn't exist on the branch. A merge commit isn't cherry-picked at reconcile, so I unwound the first merge and redid it: the merge now carries only conflict resolution (`package.json` resolved to working's `0.2.67` — the incoming bump is bookkeeping), and `cd6002e17d` carries the REQ-184 fix plus the bump to `0.2.68`.

Full suite: the failures are 11 files of KB corpus/index suites plus `bug32-webui-scope-rebrand`, all of which fail identically on the unmodified base commit. A few node build suites failed under parallel load and pass in isolation — one is a `dist-assets.staging` leftover from a concurrent build in another session, not this diff.

<!-- xgd-chat-end -->