---
uid: capability-702b7c02
id: CAP-99
type: capability
title: 'Draft Change Journal: What Changed On The Draft, And Who Changed It'
created_by: xgd
created_at: '2026-08-20T02:24:45.657288+00:00'
updated_at: '2026-08-20T02:24:45.657288+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: draft-change-journal
---

# Draft Change Journal: What Changed On The Draft, And Who Changed It

The draft is a shared mutable working copy. The client edits it directly on the page
they are looking at, the assistant edits it through its control surface, and the
operator edits it from the command line — all at the same time, and all between one
assistant turn and the next.

This capability is how any of those parties finds out **what changed since it last
looked**, at a cost proportional to *the change* rather than to *the page*.

It answers three questions at three costs:

| Question | Cost |
|---|---|
| Has anything changed since I last looked? | nothing — pushed to the assistant at the start of a turn |
| What changed? | one read, proportional to the change |
| What is the page now? | the existing full reads — the fallback |

The mechanism is a **monotone per-site change count** that every write hands back,
plus a **bounded window of self-describing records**. Because a caller's baseline
advances as it writes, any gap between its baseline and the current count is by
construction somebody else's work — nothing has to filter by actor.

**This is not the revision model.** No revision id, no publish history entry, no
participation in publish or checkout. It is also not `status`, which compares the
draft to the last *published* revision and knows nothing about ordering, actors or
before/after text.

**Losing it is never incorrectness.** A reader with no record available, or with a
baseline older than the retained window, falls back to a full re-read.
