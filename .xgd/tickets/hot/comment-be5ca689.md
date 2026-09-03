---
uid: comment-be5ca689
id: COMMENT-2176
type: comment
title: Comment on request REQ-178
created_by: xgd
created_at: '2026-09-02T23:36:47.610835+00:00'
updated_at: '2026-09-03T00:03:50.395896+00:00'
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

<!-- xgd-chat-end -->