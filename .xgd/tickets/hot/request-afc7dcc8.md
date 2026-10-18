---
uid: request-afc7dcc8
id: REQ-410
type: request
title: 'Builder parallelism: drop the ''never several at once'' conduct rule, and
  refuse a builder with no scope'
created_by: EPIC-19
created_at: '2026-10-18T19:09:31.496633+00:00'
updated_at: '2026-10-18T19:36:38.638027+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: high
  story_points: 3
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-d508f59e
  commits:
  - working_sha: c171b0ee2c897517c02f97b0c36cf6e7c6d4e3c5
    reconcile_sha: null
    main_sha: null
  - working_sha: 17d57aeefbbd339189c311c7312b72536e684457
    reconcile_sha: null
    main_sha: null
  version: 0.2.534
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

## What landed

1. **Conduct.** Both consultant priming variants replace *"One thing at a time"* with **"Saying what is running"**: *"Never tell your client that work is running at the same time unless you started it that way. When you say how long something will take, add up whatever runs one after another, and count work that overlaps once."* The `about` note for `conduct` now says the rule is about what the consultant *says*, true in both modes, and that only the `{parallel}` slot says what may actually overlap.
2. **No-scope refusal.** The host's `claim` hook (`draftClaims` in `lease-core.ts`) refuses a delegation whose `scope` is absent or empty, before the builder opens and at no cost. The framework reports it as `scope_held` with the host's sentence: *"This builder names no files in `scope`, so it was not started and nothing was spent. Name the files it will write: a section (`home.json#hero`), a page (`home.json`), a page's style (`home.json#style`), `site.json`, or a picture (`assets/logo.svg`)."* The hook is registered only where the store is leased **and** the installed `Delegate` takes a `scope` (`host-core.ts`), so where scopes aren't supported nothing changes.
3. **Test fixtures.** Every workers/test fixture that commissioned a builder with no scope now passes `scope: ['site.json', 'home.json']`, the way BUG-222 fixed REQ-379's. Six of the eight delegation tests that were already failing before this change (BUG-167 ×2, REQ-340 ×2, REQ-354 ×2) failed for that same reason: an unscoped builder could not overwrite the home page. They now pass.

## Findings

### Item 3: what an unscoped builder could do (answered)
**BUG-222's description is correct, and the lease guard had no hole.** An unscoped builder could only create new files. Any write to an existing file was refused with *"`<file>` is not in this session's scope (none declared)"*. The REQ-207 framework calls the host's `claim` with `[]` even when no scope is named, so the builder becomes a scoped writer holding nothing (`lease-core.ts` → `leased-store.ts`). A probe against the real Worker host confirmed this: an unscoped builder's `set_l1` on an existing section was refused and the section was unchanged.

**The Bob's salon 2 figures in this ticket came from a misreading.** The run's tool transcripts are in the local dev D1, as `tool_transcript` comments. They show **all 12 builders were scoped**. The consultant's Delegate inputs carry `scope` for every call after the first. The first call (the first draft) was elided in the transcript (*"kept 5800 of 8305 bytes"*), which cut off its `scope`. The builder's own refusal shows it was `(home.json, prices.json, site.json)`. The long builders ("repair the first draft", 17:59, and "layout pass", 18:30) were scoped to whole pages, plus the page styles and `site.json` for the repair. A page scope claims every section of the page, so their dozens of edits were legal. That is also why they met no scope refusals. The analysis's other conclusion still holds: **no builder was ever scoped to a section.**

Item 2 still applies going forward. It guarantees that a builder always names its files, instead of opening and then failing every write.

### A third cause: the host cannot run builders concurrently (not fixed here)
A UAT for *"two Delegate calls in one reply with non-overlapping section scopes run concurrently"* **fails against the real Worker host**. With `max_concurrent: 3`, two section-scoped Delegates in one reply ran one after another: the second builder opened only after the first had finished.

The cause is in how the host hands the consultant its tools. `host-core.ts` builds every consultant tool, `Delegate` included, as a `lib.Tool` closure (`toolSet`), so it can wrap each call in the lease writer context (`around`). In the installed framework, `ToolSet.concurrent()` asks only the declared Toolbox: *"Only a declared operation can say so; a closure never does"* (`backends/api_tools.js`). `Tool` has no concurrency flag. So `maxConcurrentTools` is passed but never takes effect for `Delegate`, and builders cannot overlap in this host whatever the priming says. Of the three causes, this is the one that alone forces serial building. The priming fix (item 1) is necessary, but it is not sufficient.

Two ways to fix it, both outside this ticket's scope: (a) an upstream change in lagrange-framework so that a registered `Tool` can declare itself `concurrent`, or so that `ToolSet` consults the declaration the closure wraps; or (b) a host refactor that hands `Delegate` to the backend as a declared surface rather than a closure. **This is the operator's call.** The UAT is written and passes nowhere until one of these lands, so it is not committed.

## Why free-coded
A priming rule swap, its UAT, and one refusal in the delegation path: small and cohesive.

## Test plan
New UATs in `tests/test_UAT_FC_REQ-410_builder_scope_and_parallel_conduct.workers.test.ts` (real Worker routes, real session manager, delegation surface and `claim` hook, real D1 leases; only the model client is scripted):
- `..._both_consultant_primings_say_what_is_running_and_never_forbid_overlap`: both priming variants contain the new "Saying what is running" rule, and neither contains "never several at once" or "One thing at a time".
- `..._with_parallel_builders_the_consultant_is_not_told_to_build_one_at_a_time`: with `max_concurrent: 3`, the consultant's system prompt says "Up to 3 builders run at once" and has no sentence telling it to build one piece at a time.
- `..._a_delegation_naming_no_files_is_refused_before_its_builder_opens`: a `Delegate` with no `scope`, and one with `scope: []`, each come back `scope_held` with the "names no files" sentence and the file-name examples. No builder request is ever made, and no lease is held.
- `..._a_delegation_naming_its_section_proceeds_and_writes_it`: a `Delegate` scoped to `home.json#hero` opens its builder, the write lands, and the lease is released.
- `..._where_the_store_is_not_leased_there_is_no_claim_and_nothing_is_refused`: without leases the host has no `claim` hook, so an unscoped `Delegate` proceeds as before.

Updated: `test_UAT_FC_REQ-389_questions_in_the_clients_terms_and_no_parallel_claims` now asserts the new wording and that "never several at once" is gone.

Not committed: the concurrency UAT (see the third cause above).

Regression run: all 26 workers suites that delegate, plus REQ-389, REQ-397 (both suites), REQ-406, BUG-168 and REQ-379 cadence (BUG-222's suite). 182 pass. 2 fail, both pre-existing and unrelated: REQ-295 `the_caller_gets_a_result…` and `a_worker_that_never_reported…` fail identically without this change, on a verdict-shape mismatch.



## Follow-up chosen (operator, 2026-10-18)
Option (a): lagrange-framework **REQ-208** lets a registered `Tool` closure declare itself `concurrent`. When it lands and the shared store is refreshed, this ticket's follow-up commit registers the host's `Delegate` closure with `concurrent: true` and commits the parallel-builder UAT.