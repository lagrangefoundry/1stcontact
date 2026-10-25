---
uid: decision-7e9f4cd9
id: DECISION-1
type: decision
title: Organise around 1c Beta Ready; retire the 1stcontact app umbrella
created_by: xgd
created_at: '2026-09-18T19:35:34.177726+00:00'
updated_at: '2026-09-18T19:35:34.177726+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  decided_at: '2026-09-18'
  rationale: An unfinishable root cannot report progress. Beta Ready can close, so
    it can say whether anything is moving.
  caused:
  - goal-7c5b4afb
  - goal-ea2db3b7
  - goal-f6704841
  - goal-4fbdf71e
  - goal-2f44fc08
  - goal-41f01345
  - goal-7b75f874
  - goal-ec95bb0a
  - goal-6be2c058
  - goal-b93b3adc
  resequenced:
  - goal-7ccc9c18
  - goal-490e0290
---

## The situation

The map was rooted at [[GOAL-1]] (1stcontact app) -- a faithful description of the product from DOC-4, with nine children spanning everything from the web editor to open design questions. It was accurate and it was useless as an objective: there is no state of the world in which it becomes realized, so it could never move, and nothing under it could be read as progress toward anything.

At the same time the model itself shifted. Goals now carry sub-goals *and epics* as children, which means the goal map and the epic backlog are one graph rather than two parallel accounts of the same work.

## What was decided

Three things, on 2026-09-18:

1. **GOAL-1 is abandoned** -- off the ladder, not failed. **1c Beta Ready** replaces it as the organising root, with the three sub-goals from the operator own breakdown: live and updatable; core web dev experience; supporting functionality.

2. **Epics attach to goals as children.** All 17 existing epics were placed. The goal map stops being a separate register from the backlog.

3. **Three future horizons are named as peers, in order** -- ready for launch / extended beta, ready to support xgd launch, complete feature set. The operator stated the consequence plainly: 1c will likely launch before xgd, and xgd will likely launch with gaps filled in afterwards.

## The alternative

Keeping GOAL-1 and hanging Beta Ready beneath it. Rejected because the pinned-realized-roots view at the top of the map is the story so far, and a root that can never be realized never joins that story -- everything below it stays invisible as accumulation no matter how much gets done.

## What it cost

Nine live subtrees under GOAL-1 are now children of an abandoned goal and need re-homing. Deliberately left in place rather than guessed at. The roll-up disagreement on GOAL-1 -- declared abandoned, derived underway -- is the map correctly reporting that unfinished business, and should clear when the nine are placed.

*Drafted from the operator breakdown of 2026-09-18 and the ticket trail. Correct the rationale where it misreads the intent.*