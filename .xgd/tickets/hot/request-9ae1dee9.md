---
uid: request-9ae1dee9
id: REQ-344
type: request
title: The consultant is told how full its context is
created_by: EPIC-19
created_at: '2026-09-28T19:38:18.843706+00:00'
updated_at: '2026-09-28T19:38:18.843706+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
---

Parent: [[EPIC-19]] (Finding 14.13). Design: [[DOC-61]] §F2, item 1.

## What changes

The site consultant is told how full its context is, before it decides what to do.
Every turn after the first carries the occupancy figure, the window, the proportion
and the room left — the same entry the settings assistant already gets.

## Why this is one line

The gauge is **built and shipped upstream**. `budgetProvider` (LF REQ-169,
`components/ai/js/src/defaults.js`) renders occupancy, window, percentage and
remaining; it returns `null` when nothing has been measured, so the entry *and* its
separator disappear on a first turn rather than reading zero. `manager.js:861` puts
`occupancyTokens` and `contextWindow` into the turn context **before** the turn runs,
for the reason this ticket exists — *"the whole failure is that cost is invisible at
the moment of choosing, so the figure has to be in the priming the model reads before
it decides what to do, not in a report it gets afterwards."*

`tools/generate/src/cli/ai/priming.json` names the entry in `settings_reminders` and
**not** in `reminders`. So the settings assistant has a fuel gauge and the site
consultant does not — the role that said, in the words quoted in [[REQ-284]]:

> I get no warning. This is the part I would most want you to know. I do not
> experience the cutoff. […] Right now I am driving with no fuel gauge.

[[REQ-284]] does not close this. Its commit prices *looking* and rewrites the
`interrupted-turn` advice; it adds no gauge entry. Checked against the commit, not
inferred from the title.

## Scope

Add the `session-budget` entry (provider `session.budget`) to `reminders` in
`priming.json`. Nothing else. No `.ts` change if the provider is already registered
for this role's runtime — verify that first, and if it is not, the registration is one
argument, as [[REQ-284]] found for its own provider.

**Out of scope:** the frozen-inside-a-turn problem. The figure this delivers is what
the *previous* turn's last request carried, which is [[DOC-61]] §2's live-occupancy
item and belongs to the upstream loop ticket. This ships the gauge that exists.

## Test plan

- A consultant session's rendered reminder text **names the occupancy figure** once a
  turn has been measured, and the numbers it carries are the session's own.
- A consultant session's **first** turn renders no gauge entry and no orphan separator
  — the `null` path, which is what stops a gauge reading zero from claiming room.
- The settings assistant's reminder is unchanged.
