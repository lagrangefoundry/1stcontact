---
uid: bug-b047afe2
id: BUG-62
type: bug
title: Every denial says access 'has ended' and none of them says why
created_by: CHAT-39
created_at: '2026-09-06T23:38:43.079204+00:00'
updated_at: '2026-09-06T23:50:08.189250+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5d576c05
  commits:
  - working_sha: 1a34cd0cd1f0f5d7c71ca3220efa1e666520c0a5
    reconcile_sha: null
    main_sha: null
  version: 0.2.122
  story_points: 2
---

**Found while walking the invite flow end to end ([[CHAT-39]]).** Two defects in one
place: the sentence is false in the commonest case, and the reason behind it reaches
nobody.

## 1. The message asserts something that did not happen

```ts
export const DENIED_MESSAGE =
  'Your access to 1st Contact has ended. Please get in touch and we will sort it out.'
```

One constant serves all five `DenialReason` values: `no_email`, `no_user`,
`user_inactive`, `no_membership`, `no_entitlement`.

For `user_inactive` and an expired grant it is true. For `no_user` and
`no_membership` it is **false** — nothing ended, because nothing ever began. And
`no_membership` is not an edge case: it is what every invited contact hits, which
makes the false reading the one most people will see. A person invited five minutes
ago is told their access has ended.

The cost is not tone. "Ended" tells the reader they had something and lost it, so they
go looking for what they did wrong or assume they were removed; the truthful answer is
that they are part-way through signing up. Those two readings lead to different actions
and only one of them is available.

**Telling the visitor little is correct and is not what this bug disputes.** A refusal
that distinguished `no_user` from `no_membership` would be a membership oracle — anyone
could test addresses against the contact list. The fix is a sentence that is true of
every reason without naming which, not a sentence per reason.

## 2. The reason reaches no log, so a refusal cannot be diagnosed

`admit` computes a `DenialReason` and the caller renders `DENIED_MESSAGE`. The reason
is not written anywhere. There is no log line, no event, nothing an operator can read
after the fact.

**This already cost a diagnosis in the session that found it.** The operator could not
sign in to their own local deployment. Nothing in the running system said why — the
answer was a duplicated `PLATFORM_ADMINS` key in `.dev.vars`, found by reading the file
rather than by observing the Worker. Every refusal is currently a silent one, and the
next occurrence will be on a deployment where nobody can read the config.

The repository already has the convention this needs — `router.ts` writes
`console.warn(JSON.stringify({ event: 'invite_refused', … }))`. A denial should do the
same.

**There is no disclosure risk in doing so.** The log is ours. The whole reason the
visitor is told nothing is that they are unauthenticated; the operator reading the
Worker's output is not.

## Scope

- one message, true for every reason, that does not claim anything ended
- a structured log line at the point of denial, carrying the reason and the email that
  was attempted
- no change to what the visitor is told about *which* reason applies

Not in scope: what a refused-but-legitimate invitee should be shown instead of a
refusal at all. [[REQ-203]] removes them from this path entirely by provisioning a
business on acceptance, and the two should not be conflated — this bug is about the
refusals that remain correct.

## Acceptance

- the denial message is true for all five `DenialReason` values, and asserts no ending
- the message still does not reveal which reason applied
- every denial writes one structured log line carrying the reason and the attempted
  email, in the `console.warn(JSON.stringify({ event: … }))` shape `router.ts` uses
- a refusal can be diagnosed from the Worker's output alone, without reading
  configuration files
- an operator refused by a misconfigured `PLATFORM_ADMINS` sees a log line naming
  `no_user`


---

## What the code actually held when this was implemented

Recorded because half of §2's diagnosis was already true, and the fix is different
if you assume it was not.

`index.ts` already wrote `console.warn(JSON.stringify({ event: 'admission_denied',
reason, email }))` — inside `denied()`, the function that renders the 403. So the
reason did reach a log. What it did *not* have was any guarantee attached to the
**decision**: the line was a property of one call site beside one `new Response`,
so a second caller of `admit`, or a refusal reason added to `admit` later, was a
silent one. Nothing pinned it either — no test asserted the line existed, so it
could be deleted without anything going red.

That is why the fix moves the line rather than adding one. `admit` records the
reason at the point it decides it, and `denied()` now only renders. One denial,
one line, wherever it is rendered from.

## Additions to scope, and why each is a consequence of what was asked

- **The log line moves into `admit`.** "A structured log line at the point of
  denial" is what the scope asks for, and the point of denial is where the reason
  is computed, not where the response is built. Writing it in both places would
  put two lines in the log for one refusal, so `index.ts`'s copy is removed in the
  same change.

- **The line carries `platformAdminSeed`.** The acceptance asks that "a refusal
  can be diagnosed from the Worker's output alone, without reading configuration
  files", and `reason: no_user` alone does not do that for the case this bug was
  filed from: it is equally what an uninvited stranger gets. This boolean says
  whether *this deployment* names *this address* in `PLATFORM_ADMINS`, which is
  the fact the operator went to `.dev.vars` to find. It is a statement about
  configuration the operator already holds and about no person, so it discloses
  nothing further.

- **The message is worded about the request, not about the person.**
  `DENIED_MESSAGE` is rendered on a second path — `index.ts`'s `refused()`, a
  scope refusal, where the caller *is* admitted and merely named a business that
  is not theirs. "You have no access to 1st Contact" would be false of exactly
  that reader, so the sentence had to be true of both paths for the two to stay
  byte-identical without either of them lying. It reads: *"1st Contact cannot open
  this for you at the moment. Please get in touch and we will sort it out."*

- **`no_entitlement` is not covered by a denial line, and that is correct.** It no
  longer produces `ok: false` ([[DOC-42]] §10.1) — a member whose grant lapsed is
  admitted with nothing selectable — so it is logged by `index.ts` as
  `no_business` where the consequence is. The four reasons that can still refuse
  are the ones the UATs drive.

## What landed

- `apps/control-app/src/identity.ts` — `DENIED_MESSAGE` reworded; a `denyAdmission`
  helper that logs and returns, used by all four refusal returns in `admit`.
- `apps/control-app/src/index.ts` — `denied()` no longer logs and no longer takes
  the admission; the response is all it makes.
- `tests/test_UAT_FC_BUG-62_denial.workers.test.ts` — seven UATs in workerd against
  real D1: the sentence claims nothing ended, the sentence names no reason, each of
  the four refusing reasons writes exactly one structured line carrying itself and
  the attempted address, an admitted person writes none, a misconfigured
  `PLATFORM_ADMINS` reads as `no_user` with `platformAdminSeed: false`, and the same
  address named correctly is seeded and never reaches the log.

The wire is pinned next door and deliberately not restated:
`test_UAT_FC_REQ-167_the_refusal_does_not_say_which_check_failed` already drives the
Worker end to end through a real Access token and asserts the 403 body *is*
`DENIED_MESSAGE` and that two different reasons are byte-identical. What this ticket
adds is what that body is now required to say.