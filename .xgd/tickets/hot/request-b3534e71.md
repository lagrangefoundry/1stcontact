---
uid: request-b3534e71
id: REQ-343
type: request
title: The consultant stops writing L1
created_by: EPIC-20
created_at: '2026-09-27T22:31:31.949374+00:00'
updated_at: '2026-09-28T22:36:30.654617+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  epic_parent: epic-0923bb64
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-18898cd8
  commits:
  - working_sha: 0f380ec7739d76edbcdb03e4d437a9654f357cef
    reconcile_sha: null
    main_sha: null
  - working_sha: 9e36aac12b8a8cd2a663cbffc5f6964812493711
    reconcile_sha: null
    main_sha: null
  - working_sha: ba9f6d8c24294ff10af2db49b9bbe1836394b654
    reconcile_sha: null
    main_sha: null
  version: 0.2.400
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

**It only ever removes.** The narrowing drops group names and adds none, so no
arrangement of declarations can widen a grant through it — the same one-directional
property the surface narrowing beside it already has.

**And it refuses what it cannot read.** A surface with no declaration to hand, or a
scope named some way other than by groups, is a start-up failure naming the surface
rather than a scope passed through. Passing one through would keep whatever authority
it carried because a declaration was missing, which is the one direction this must not
fail in.

**Both hosts read the key**, as both already read `enabled` — a switch only one could
see would mean the Worker commissioned construction while the operator's own `1c chat`
still wrote it, which is the divergence REQ-146 split the host to prevent. The
consequence is that a suite using the CLI consultant as a HARNESS — for the tool loop,
the change signal, session binding, a picture in a turn — installs `primary_writes:
true` to keep its own subject testable. None of those cases is about who holds the
write tools, and each says so where it installs it.

**The prose follows the key, in both tiers.** `delegationMethod` already returns a
template or `null` on one condition; it takes the second and swaps the paragraph that
frames the work. REQ-342 landed first and wrote that paragraph — *construction is
commissioned here, not performed* — so this ticket rebases onto it rather than rewriting
it: REQ-342's opening becomes the framing a `primary_writes: false` deployment sends, and
the second framing exists for the FLIP-BACK. That direction is the one that matters to a
rollback: prose telling a session that building is not its work, read by a session holding
every write group, suppresses tools it has just as surely as the other direction invents
ones it has not. The rest of the method — how to write a brief, what to ask to have
checked, what comes back, what the record cannot settle — is true either way and is not
duplicated.

**And the tail moves with it.** REQ-342 put the standing instruction in the per-turn
reminder, which is re-assembled and re-sent on every turn, so a tail that contradicts the
grant repeats that contradiction for the life of the engagement. `delegationReminder` takes
the same second condition and the same pair of framings. A flip-back that reached the
preamble and not the tail would not be a flip-back.

**One rule in three places.** An absent `primary_writes` reads as `false`, the document
ships it `false`, and a caller that never answered the question gets the same framing —
rather than a fourth state nobody deployed. The words stay in `priming.json` and the
condition stays in code, which is where REQ-295 put that seam.

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
the diff provider, the worker's context and the builder's grant. **REQ-342 was not a
dependency, and it landed first.** It rewrote the whole method template and put a standing
line in the per-turn tail. Neither the key nor the derivation needed it; what it changed is
that the framing this ticket installs for the shipped configuration is REQ-342'''s own words
rather than new ones, and that the second framing — the flip-back'''s — has a tail half as
well as a preamble half.

## Not in scope

Any change to what a worker may do — that is the grant ticket. Any surface other
than L1: the consultant goes on registering a client's file through the catalogue
(`place_on_site`) and re-editing a picture's recipe (`edit_image`), because neither
writes L1 and both are nearer curation than construction — and those grants travel
with their surfaces rather than sitting in the document this narrows. Any change to `enabled`,
which stays exactly as it is because it is the rollback: this ticket adds a key beside it
and gives it no new meaning. Any rewrite of REQ-342'''s method prose or standing line beyond
giving each of them a second framing.