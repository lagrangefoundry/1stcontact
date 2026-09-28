---
uid: request-b3534e71
id: REQ-343
type: request
title: The consultant stops writing L1
created_by: EPIC-20
created_at: '2026-09-27T22:31:31.949374+00:00'
updated_at: '2026-09-28T19:10:26.960933+00:00'
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
   brief to a worker and nothing else.

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
"primary_writes": true
```

`true` is today: both roles can write. `false` is this ticket's end state: the consultant
holds the read groups only.

**`enabled` dominates it, structurally rather than by a check.** The narrowing is applied
at exactly the point the delegation surface is composed — the same non-null runtime that
composes `delegate` — so there is no reachable configuration in which the consultant has
lost its write groups and has no worker to commission. That is behaviour 3 held as a
property of the wiring rather than as a rule someone has to remember:

| `enabled` | `primary_writes` | consultant's L1 grant | `delegate` | method prose |
|---|---|---|---|---|
| `true` | `true` (ships) | full, as `instances.json` | yes | delegate-first |
| `true` | `false` (end state) | read groups only | yes | commission-only |
| `false` | ignored | full, as `instances.json` | no | none |

**The withheld groups are derived, not listed.** Every group in `l1-surface.json` declares
its `effect`, so the narrowed grant is the consultant's `instances.json` entry filtered to
`effect: "read"`. Nothing hand-maintains a second list of write groups, a write group
added later is withheld without an edit, and `instances.json` goes on stating the
consultant's maximum authority — which is what makes the rollback restore the right thing
without recording it anywhere else.

**Absent means `true`.** A document that omits the key leaves the consultant its hands.
The omission has to fail in that direction: the other one turns a forgotten key into a
primary that cannot build. Present and not a boolean is a start-up refusal naming the key,
as `enabled` already is.

**The prose follows the key.** `delegationMethod` already returns a template or `null` on
one condition; it takes the second condition and returns the commission-only text when the
consultant cannot write. The words stay in `priming.json` and the condition stays in code,
which is where REQ-295 put that seam.

**Consequence worth naming: `DrawImages` goes too.** `write_image` is declared
`effect: "write"`, so the derivation withholds it and drawing an image becomes a worker's
job. Keeping it would mean an exception list, which is the hand-maintained list this
derivation exists to avoid. The builder holds the group already.

## The gate

This ticket is held until the record shows, over **ten consecutive delegations**:

- no delegation returns `silent` while its diff contains writes; and
- no delegation's diff contradicts its own self-report.

Both are facts about recorded runs rather than judgements, so the gate can be checked
rather than argued. Today the first condition fails at **2 of 7** and the second is
unmeasurable, which is the point of the diff.

**What the gate now governs is the key, not the merge.** The code lands with
`primary_writes: true`, which is inert — the shipped behaviour is byte-for-byte today's.
The gate is the condition for setting it `false` in a deployment, so the evidence no
longer blocks the implementation.

## Dependencies

All of DOC-60's preceding tickets: the upstream result-accounting ticket, the diff
provider, the worker's context, the builder's grant, and the delegate-first prose. This
is the only ticket in the set that is gated on evidence rather than on code.

## Not in scope

Any change to what a worker may do — that is the grant ticket. Any change to `enabled`,
which stays exactly as it is because it is the rollback: this ticket adds a key beside it
and gives it no new meaning.
