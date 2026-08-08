---
uid: sprint-a864c33e
id: SPRINT-2
type: sprint
title: 'Sprint 2: Prove the component-resolution anchor — a linked working tree consumes
  the main checkout''s installed store'
created_by: xgd
created_at: '2026-08-08T01:09:07.561131+00:00'
updated_at: '2026-08-08T01:30:19.407578+00:00'
completed_at: null
last_field_updated: goals
status: in_progress
fields:
  number: 2
  intent_uid: bug-5cabb340
  goals: 'Close the single gap Sprint 1''s review left open: the main-checkout resolution
    anchor introduced at tools/generate/src/cli/webui.ts:51-101 is load-bearing and
    correct, but carries no acceptance evidence of its own — today''s coverage is
    incidental to the fact that the suite happens to run inside a linked working tree.
    Deliver checkout-independent evidence for AC-1030 against temporary fixture directories
    reproducing each .git shape, so the story''s central claim (a linked working tree
    and the main checkout resolve the identical installed store) is asserted by name
    instead of by environment. Reconciliation-shaped delta: the behaviour is authoritative
    as shipped and no runtime code change is in scope.'
  start_date: '2026-08-07'
  duration: 14
  task_count: 0
  task_specs: []
  story_uids:
  - story-e674c60a
  story_count: 1
  story_order:
  - index: 1
    story_uid: story-e674c60a
    story_kind: upgrade
    title: 'The builder workspace: one browser surface showing my real rendered site,
      with the controls that act on it, served from a single origin'
    dependencies: []
---

# Sprint Summary

**Intent**: bug-5cabb340 (BUG-32 — Rebranding gap: WEBUI_SCOPE still resolves the superseded scope)
**Mode**: regression — Sprint 1 (sprint-9006c5b0) passed its delta but failed review on one narrow point; this sprint restores the green.

## Selected Stories

- STORY-99: 'The builder workspace: one browser surface showing my real rendered site, with the controls that act on it, served from a single origin' (upgrade)

STORY-99 is owned by bundle-15c1f647 and reaches this sprint via `fields.updated_by = [bug-5cabb340, sprint-9006c5b0]`. Its `intent_uid` therefore does not equal this intent — expected for a story routed in from another intent, not a reason to skip it. It is the only eligible story: the four eligibility queries return this story and nothing else, so the backlog for this intent is otherwise empty and capacity (5) is not the binding constraint.

## Story Order

| # | Story | Kind | Dependencies |
|---|-------|------|--------------|
| 1 | STORY-99: The builder workspace: one browser surface showing my real rendered site, with the controls that act on it, served from a single origin | upgrade | - |

No composition story is in play, so no `composes` ordering constraint applies.

## Goals

Give the component-resolution anchor acceptance evidence that does not depend on which checkout the suite runs from. Sprint 1 delivered the rebrand in full — the scope is written once, every generated reference composes from it, the superseded literal survives in no tracked file, and the silent-green skip is gone — but closing the intent required net-new production code at the story's single resolution point (`mainCheckout()` / `walkOrigin()`), and that code is asserted by no criterion and named by no test. This sprint converts environment-incidental coverage into an explicit, checkout-independent criterion.

## Scope of the delta

Only the criterion the sprint review added is in play. Previously completed workspace behaviour (modes, toolbar, split persistence, freshness, confinement, publish path) and the Sprint 1 rebrand criteria (AC-960, AC-961, AC-963) are not re-implemented — they stand as evidence and must remain green.

Delta acceptance criterion:

- **AC-1030** (acceptance_criterion-1b27e14b) — *The components consumed are the repository's own, identically from any of its working trees.* Which installed copy this repository consumes is decided by which repository the run belongs to, never by where on disk it executes from. Anchoring behaviour by checkout shape: a main checkout (`.git` a directory) anchors to itself; a linked working tree (`.git` a file naming a `gitdir` whose `commondir` names the main `.git`) anchors to the main checkout, not the worktree; a `gitdir` pointer with no `commondir` anchors to the pointer's own directory; a location under no checkout anchors to the walk origin, terminating there rather than throwing or climbing to the filesystem root. The observable consequence is an equality: the component directory `webuiPackageDir()` reports from a linked working tree is the *same* directory it reports from the main checkout.

## Execution constraints

- **Tests-only.** The review classified this item as `reconciliation`: the anchoring behaviour is correct as shipped and authoritative. No runtime change to `tools/generate/src/cli/webui.ts` (or any other production file) is in scope. The story ticket's `story_kind` remains `upgrade` because the delta lands in place on an existing story; the *work* is reconciliation-shaped, and a GREEN phase that edits production code is out of scope. If a UAT and the shipped behaviour disagree, the UAT is wrong.
- **Evidence must be checkout-independent.** Exercise each `.git` shape against temporary fixture directories, not against the ambient worktree. Coverage that passes only because this worktree happens to be a linked one is the gap being closed, not a fix for it — from the main checkout, ordinary upward resolution satisfies AC-961 even if `mainCheckout` were broken, leaving three of five branches unexecuted.
- **No mocking of the resolver.** Sprint 1's evidence used the real resolver, the real out-of-repo store and real generator output; hold that bar. Fixtures stand in for checkout *shapes*, never for the resolution logic under test.
- **Regression set.** The Sprint 1 suites (`tests/bug32-webui-scope-rebrand.test.ts`, `tests/reconciliation-builder-workspace-origin.test.ts`, `tests/reconciliation-builder-workspace-chrome.test.ts`) form the evidence set and must stay green — 24 tests, 0 skipped at last scoped quality run (report-eeea9952).
