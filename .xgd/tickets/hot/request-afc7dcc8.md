---
uid: request-afc7dcc8
id: REQ-410
type: request
title: 'Builder parallelism: drop the ''never several at once'' conduct rule, and
  refuse a builder with no scope'
created_by: EPIC-19
created_at: '2026-10-18T19:09:31.496633+00:00'
updated_at: '2026-10-18T19:09:31.496633+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Why

Builders never run in parallel, though everything EPIC-24 built for it is in place: the installed framework runs `Delegate` calls concurrently (lagrange-framework REQ-207), `delegation.json` sets `max_concurrent: 3`, draft files are leased (REQ-397), and pages are stored as a frame plus sections (REQ-396; Bob's salon 2's home has 10 section files, prices 11).

Measured (2026-10-18): across both Bob's Salon runs, **23 builder sessions, none overlapping**. The three looks in Bob's salon 2 had three different files and correct scopes and still ran one after another, about 14 minutes where 5 would have done. **No builder was ever scoped to a section**; scopes were whole pages, or none (7 of 12 calls).

Two causes:
1. **The conduct priming forbids it.** REQ-389 added, after Charlie 3's false parallel claim: *"Building work runs one piece at a time, never several at once."* Its note says it *"holds until builder sessions can overlap."* They now can, and the rule was never removed, so it contradicts the `delegation-parallel` paragraph and wins. It is pinned by `test_UAT_FC_REQ-389_questions_in_the_clients_terms_and_no_parallel_claims`, which is why it couldn't change in the prompt-only commit.
2. **A builder can be commissioned with no scope.** Then it holds no files, nothing can run beside it, and per BUG-222's diagnosis it may not overwrite existing files at all.

The prompt side is already done (`1c44ce9957`): `delegation-parallel` and its reminder now tell the consultant to commission independent pieces in one reply, scoped by section, and `delegation-files` says never to commission a builder without a scope.

## What changes

### 1. The conduct rule tells the truth in both modes
Replace the conduct section *"One thing at a time"* (both consultant priming variants) with a rule true whether or not builders can overlap:
> **Saying what is running.** Never tell your client that work is running at the same time unless you started it that way. When you say how long something will take, add up whatever runs one after another, and count work that overlaps once.

What may actually run at once stays the `{parallel}` slot's job alone. Update the priming's `about` note for `conduct` to match (it currently says the one-at-a-time rule "holds until builder sessions can overlap"). Update the REQ-389 UAT to assert the new wording, and that the old "never several at once" sentence is gone.

### 2. A builder without a scope is refused
Where the store is leased and the installed `Delegate` takes a `scope`, a `Delegate` call with no `scope` (or an empty one) is refused before the builder opens, at no cost, with a message saying to name the files it will write (`home.json#hero`, `home.json`, `site.json`, …). Where scopes aren't supported, nothing changes.

### 3. Pin down what an unscoped builder could do
BUG-222's diagnosis says an unscoped builder may only create new files and any write to an existing file is refused. Bob's salon 2 doesn't fit that: unscoped builders ("repair the first draft", "layout pass") made 39–78 calls with no scope refusal, and there were only 12 refusals across all 12 builders. Find out which is true and record it in this ticket. Item 2 makes the question moot going forward, but if unscoped builders could write freely, the lease guard had a hole that item 2 closes, and that should be stated.

## Why free-coded
A priming rule swap, its UAT, and one refusal in the delegation path: small and cohesive.

## Test plan
UATs (`test_UAT_FC_<ID>_*`), plus the updated REQ-389 UAT:
- Both consultant priming variants contain the new "Saying what is running" rule and not "never several at once".
- With parallel delegation available, the consultant's priming contains no sentence forbidding several builders at once.
- A `Delegate` call with no `scope` is refused before the builder opens, with the message naming how to scope; one with a scope proceeds.
- Without scope support, an unscoped `Delegate` still proceeds (unchanged).
- Two `Delegate` calls in one reply with non-overlapping section scopes run concurrently (both open before either finishes).

Regression: REQ-389, REQ-397 (both suites), REQ-379 cadence, BUG-222.
