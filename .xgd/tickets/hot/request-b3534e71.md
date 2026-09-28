---
uid: request-b3534e71
id: REQ-343
type: request
title: The consultant stops writing L1
created_by: EPIC-20
created_at: '2026-09-27T22:31:31.949374+00:00'
updated_at: '2026-09-28T19:31:52.346200+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  epic_parent: epic-0923bb64
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-18898cd8
---

## Why

**DOC-60** §"4. The primary stops writing L1" and §"Why this order, and what gates the
last step". This is the design's end state and its last step.

The measured case for it: across the metered window workers did **27% of the element
writes for 2.9% of the spend**, at **$0.046 per element write against the consultant's
$0.54** — about twelve times cheaper — and every write a worker landed has stayed and
none has been found wrong. The model that is right for judgement is the wrong one for the
mechanical majority of the work, and paying its rate for that majority is the waste
EPIC-20 exists to remove.

## Behaviour

1. **The consultant can read the whole site and write no part of its L1.** It keeps
   every read, every measurement and every camera; it loses the authority to replace an
   element, author a page, write configuration or change the palette.

2. **Construction is commissioned.** The consultant's route to a change in the site is a
   brief to a worker and nothing else. Its method prose says so: a deployment where it
   cannot write must not be told to weigh handing work over against doing it itself,
   because there is nothing to weigh.

3. **The delegation rollback still works.** With delegation disabled in configuration the
   surface is not composed at all, so this ticket must not leave a state in which the
   consultant can neither write nor delegate. Turning delegation off must remain a true
   rollback.

4. **It is one deploy-time key, and flipping it back is one edit.** The narrowing is a
   setting rather than a code change, so a deployment that goes wrong is recovered by
   restoring the key and redeploying — not by reverting a merge. See "As configuration".

## As configuration

`delegation.json` gains a second top-level key beside `enabled`:

```
"primary_writes": false
```

`false` is this ticket's end state and **is what ships**: the consultant holds the read
groups only. `true` is the previous behaviour, where both roles can write, and it is the
flip-back.

**Absent means `false`.** The shipped document states the key anyway, so the value is
readable where an operator looks rather than resolved in code; but a replacement document
that omits it gets the design rather than the state the design replaced. Present and not a
boolean is a start-up refusal naming the key, as `enabled` already is.

**`enabled` dominates it, structurally rather than by a check.** The narrowing is applied
at exactly the point the delegation surface is composed — the same non-null runtime that
composes `delegate` — so there is no reachable configuration in which the consultant has
lost its write groups and has no worker to commission. That covers both ways the surface
can be absent: the switch off, and a switch on with no worker role bound. Behaviour 3 is
then a property of the wiring rather than a rule someone has to remember:

| `enabled` | `primary_writes` | consultant's L1 grant | `delegate` | method framing |
|---|---|---|---|---|
| `true` | `false` (ships) | read groups only | yes | commissioning |
| `true` | `true` | full, as `instances.json` | yes | choosing |
| `false` | ignored | full, as `instances.json` | no | none |

**The withheld groups are derived, not listed.** Every group in `l1-surface.json` declares
its `effect`, so the narrowed grant is the consultant's `instances.json` entry filtered to
`effect: "read"`. Nothing hand-maintains a second list of write groups, a write group
added later is withheld without an edit, and `instances.json` goes on stating the
consultant's maximum authority — which is what makes the rollback restore the right thing
without recording it anywhere else.

**Only the consultant narrows.** The worker's own grant is untouched, and so is every
other role: a role that does not delegate has nothing to commission with.

**The prose follows the key.** `delegationMethod` already returns a template or `null` on
one condition; it takes the second and swaps the paragraph that frames handing work over
as a choice for one that says construction is commissioned. The rest of the method — how
to write a brief, what to ask to have checked, believing the checks — is true either way
and is not duplicated. The words stay in `priming.json` and the condition stays in code,
which is where REQ-295 put that seam.

**Consequence worth naming: `DrawImages` goes too.** `write_image` is declared
`effect: "write"`, so the derivation withholds it and drawing an image becomes a worker's
job. Keeping it would mean an exception list, which is the hand-maintained list this
derivation exists to avoid. The builder holds the group already.

## The gate

DOC-60 held this ticket until the record showed, over **ten consecutive delegations**:

- no delegation returns `silent` while its diff contains writes; and
- no delegation's diff contradicts its own self-report.

**The key discharges the gate rather than satisfying it.** The gate existed because
removing the consultant's hands by merge is a one-way door: a delegation surface that
loses writes silently would stand up a deployment that cannot build and cannot be talked
out of it. With the narrowing behind a deploy-time key that restores the full grant in one
edit, the door swings both ways, and waiting ten delegations to begin saving the twelve-fold
difference costs more than the risk it removes. The two conditions remain worth watching —
they are facts about recorded runs rather than judgements — but they gate nothing here.

## Dependencies

DOC-60's preceding tickets that this rests on have landed: the result-accounting ticket,
the diff provider, the worker's context and the builder's grant. **REQ-342 is not a
dependency.** It rewrites the whole method template and puts a standing line in the
per-turn tail; this ticket only swaps the one paragraph that would be false in a
deployment where the consultant cannot write, and leaves REQ-342 free to rewrite both
variants when it lands.

## Not in scope

Any change to what a worker may do — that is the grant ticket. Any change to `enabled`,
which stays exactly as it is because it is the rollback: this ticket adds a key beside it
and gives it no new meaning. REQ-342's per-turn reminder, and its rewrite of the method
prose beyond the framing paragraph.
