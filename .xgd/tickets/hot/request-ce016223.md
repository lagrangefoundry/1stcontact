---
uid: request-ce016223
id: REQ-321
type: request
title: Take element authoring off the consultant so construction must be delegated
created_by: EPIC-20
created_at: '2026-09-25T03:59:12.140415+00:00'
updated_at: '2026-09-25T03:59:12.140415+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Why

Delegation works and is barely used. Measured on the dev environment
(EPIC-20 holds the full reading):

- **5.7%** of all metered spend has been delegated — $1.33 against $21.84.
- **2026-09-22: seven delegations across five turns. 2026-09-24: one across
  nine.** Identical configuration, identical prose, and the operator never asked
  for delegation in either sitting — all eight delegations were model-initiated.
- The consultant is **not** discriminating by job size. It delegated a 27-write
  sweep in the morning and then did **10-write and 14-write sweeps itself** at
  19:35 and 20:04 local, on Opus, at $3.32 and $4.24.

REQ-295 shipped the additive grant — option (a) — knowingly accepting that
*nothing gives the consultant a per-turn reason to delegate*, on the grounds that
the outcome would be measurable. It has been measured. **The variance, not the
level, is the finding:** a lever that yields 7-in-5 one day and 1-in-9 two days
later is not one capacity can be planned around, and no amount of more
persuasive prose in a prefix that is 186k deep by the end of a sitting changes
its character. This is option (b) from REQ-295's body, taken off reserve.

Rough size of the prize: the evening cost **$0.35 per site write**; the 09-22
workers cost **$0.14–$0.57 each** for sweeps of comparable size.

## What changes

**The consultant loses the ability to author elements. A worker gains being the
only thing that can.**

### The group boundary does not match the decision boundary

The obvious edit — drop `AuthorPages` from `consultant.l1.groups` in
`instances.json` — is one line and is **wrong**, because `l1-surface.json`
declares:

```
AuthorPages  ['set_l1', 'set_page_style', 'use_font']
```

`set_l1` is construction and should go. `use_font` and `set_page_style` are
**decisions**, and the consultant made them correctly this very morning: it bound
the two typefaces with two `use_font` calls and *then* handed the 27-element
sweep to a worker. That is precisely the division this ticket wants, and removing
the group wholesale would break the good half of the only good example we have.

So `AuthorPages` splits. Names are the implementer's, but the cut is:

- **element authoring** — `set_l1` — which the consultant loses and the builder
  keeps.
- **page styling and typeface binding** — `set_page_style`, `use_font` — which
  both roles keep.

Both documents are in-repo (`tools/generate/src/cli/ai/`), so this is a
declaration edit and a grant edit, not a framework change.

### Check the carve-out for back doors before trusting it

The consultant retains `ManagePages` (`add_page`, `copy_page`, `update_page`,
`remove_page`) and `ManageComponents`. Whether any of those can author element
content — and so reopen the path this ticket closes — must be **established
rather than assumed**. If one can, it is part of the cut.

### The failure mode to design against

A consultant that cannot write must **delegate**, not **narrate**. The mode to
prevent is the one where it tells the client "I'll update that" and nothing
happens, or where it describes the change instead of causing it. The method prose
already asks the consultant to write a brief and define checks; what it has never
had to handle is having no alternative. That paragraph needs revising alongside
the grant, and the behaviour needs a UAT of its own — a consultant asked for an
element change produces a delegation, not a sentence.

## Why the grant and not a per-turn allowance

The alternative considered was keeping `set_l1` and capping it — N writes per
turn, the N+1th refused with a message naming delegation, the refusal doubling as
the per-turn signal the current design lacks. It is rejected as the primary
mechanism for two reasons:

- **It breaks sweeps in the middle.** The consultant makes three writes, is
  refused, and must now brief a worker on "the remaining eleven elements" — which
  it has to discover and describe accurately, from a page it has already left
  half-changed. A brief written up front is strictly better than a brief written
  after hitting a wall.
- **It is state where the grant is a fact.** A counter scoped to turn and role is
  machinery that can be wrong; an absent tool cannot be.

**The latency objection, which is the real one.** Today's delegation took
**2m54s** wall clock — unacceptable per iteration if the operator is tuning a
line's position by eye. But that worker made **70 tool calls**; delegation
latency scales with the job, and a single-element brief should cost a fraction of
it. **That assumption is the first thing to check**, because the whole trade rests
on it. If a one-element delegation turns out to be slow, the allowance returns as
the fallback — the same way this ticket was held in reserve.

## Rollback

Configuration, following `delegation.json`'s precedent exactly: the switch that
turns this off restores the consultant's grant, and a deployment with it off is
indistinguishable from this repository today. A capability change that can only
be reverted by a release is one nobody will try.

## How it will be known to work

- A consultant asked for an element change delegates it, and the element changes.
- The consultant can still bind a typeface and set a page style without a worker.
- REQ-293's split-by-model shows the delegated share moving off 5.7%.

That last measurement depends on **BUG-145** — the split currently loses half its
subject, so until that lands there is no instrument fit to grade this change.
