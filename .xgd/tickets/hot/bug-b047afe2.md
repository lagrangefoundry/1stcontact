---
uid: bug-b047afe2
id: BUG-62
type: bug
title: Every denial says access 'has ended' and none of them says why
created_by: CHAT-39
created_at: '2026-09-06T23:38:43.079204+00:00'
updated_at: '2026-09-06T23:38:43.079204+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
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
