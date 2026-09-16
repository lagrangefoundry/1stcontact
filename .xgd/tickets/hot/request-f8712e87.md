---
uid: request-f8712e87
id: REQ-255
type: request
title: 'Regression rail: a recorded baseline per reference, and one command that says
  ''no worse'''
created_by: EPIC-12
created_at: '2026-09-16T01:47:35.544080+00:00'
updated_at: '2026-09-16T01:47:35.544080+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

Parent: [[EPIC-12]] §8.4. Second of three. **Must land before [[REQ-254]]'s
console is allowed to edit code (T3).**

## Goal

The safety rail that an automated iteration has to pass before it is allowed to
finish. It answers one question — **"is everything still as good as it was?"** —
and it must be able to answer "no" convincingly, naming what broke.

The characteristic failure of a code-editing loop is that **the AI fixes the site
in front of it and breaks the two it cannot see.** Nothing in the repo currently
records what a good result looks like per reference site, so "no worse than
before" is not computable today.

## Behavior

1. **A gate baseline is recorded per stored reference site.** The baseline says
   what that reference's reproduction currently scores, in enough detail that a
   later run can be judged better, the same, or worse.
2. **One command runs the whole rail** and reports a single pass/fail, so an
   automated caller has exactly one thing to check.
3. The rail **re-gates every stored reference** — `faelan.com`,
   `gigabytealchemy.ai`, `joyfulculinarycreations.com` today — and **fails if any
   of them regressed against its baseline**.
4. **When the rail fails it names which reference regressed and on what**, not
   just that something did. A rail that says only "fail" cannot be acted on by
   the thing it is restraining.
5. The rail **runs the reproduction test suite** and **the typecheck**.
6. The rail **runs a Worker build check**. `apps/control-app` imports the
   reproduction engine directly from `tools/generate/src/`, so engine edits are
   edits to deployed code; a build check makes "the control app no longer
   builds" surface in the round that caused it rather than at the next deploy.
7. **Baselines are updated deliberately, never silently.** Re-recording a
   baseline is an explicit act by a person. An automated run may never move the
   bar it is being measured against.
8. The rail is **fast enough to run every iteration** — it sits in the inner loop,
   so its runtime is a design constraint, not an afterthought.

## Out of scope

- Any AI, and any code-editing (T3).
- Adding new reference sites. Three is thin and it is enough to catch the failure
  mode that matters; growing the corpus is separate.

## Testable at the end

Run the rail on a clean `main`: it passes. Then deliberately break a serializer
in the reproduction engine and run it again: **it fails, and it names which
reference site regressed.** Both directions must be demonstrated — a rail only
ever seen passing has not been tested. Time the run and record the number, so
the subset-vs-whole-suite question ([[EPIC-12]] §9 Q7) can be settled with a
measurement.

Related: [[EPIC-12]] §8.4, §8.6 · [[REQ-254]] · [[DOC-19]] (the 3-probe gate)
