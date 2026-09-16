---
uid: request-c1c5261a
id: REQ-256
type: request
title: 'AI iteration in the console: review the diff, change the engine, stop for
  the human'
created_by: EPIC-12
created_at: '2026-09-16T01:47:59.959791+00:00'
updated_at: '2026-09-16T02:56:19.030658+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

Parent: [[EPIC-12]] §8. Third of three. **Depends on [[REQ-254]] (the console) and
[[REQ-255]] (the rail).** The rail must already exist, and must already have been
seen to fail correctly, before this loop starts producing change proposals.

## Goal

Put the AI into the console's loop — one iteration at a time, with a human
between every round. This is loop 1 of [[EPIC-12]] §7: the AI's job is to
**improve the reproduction engine**, not to patch the site in front of it.

**In v1 the AI does not write code.** It reviews the diff, diagnoses the
residual, and **files a gap ticket** against the engine. The operator free-codes
that ticket in the ordinary way, and pressing [run again] re-runs the
reproduction with whatever has landed since. See [[EPIC-12]] §8.2 for why this
trade is worth its slower cadence — chiefly that every engine fix then acquires a
UAT and matrix coverage, and that the diagnosis and the fix are judged by
different agents.

We watch it work a few times before we consider letting it do more.

## Behavior

1. **As soon as an iteration's links appear, an AI process starts**, prompted to
   review the diff and diagnose the gap. It is not started by a separate button.
2. **The AI's transcript streams onto the page** as it works, under that
   iteration, so the human can see what it is doing while it does it.
3. **The AI writes no code.** It does not edit `tools/generate/`, it does not
   commit, and it does not touch the reproduced site. A round that ends in an
   edit rather than a ticket is a defect.
4. **The AI's deliverable is a gap ticket** against the reproduction engine,
   created through `xgd ticket create` at `status=draft` — never at any
   `ready_*` status, which would spawn an automated pipeline against it. The
   ticket must carry, so the claim is checkable without re-deriving it:
   - the **named residual class** (what kind of gap this is, not just "the hero
     is wrong");
   - **which stored reference(s)** exhibit it;
   - the **evidence** — the `check_fidelity` verdict, the `regions` entry, the
     `values-diff` lines. Nothing that could only be read off a screenshot;
   - the **hypothesis** about which part of the engine is at fault;
   - the **proposed change**.
5. **A fourth link appears on each iteration: the ticket the AI filed**,
   alongside the original / reproduction / diff-images links. Once that ticket is
   free-coded its `fields.commits` is the code diff, so "what changed" is
   reachable without the console tracking it separately.
6. **One ticket per gap class, not per iteration.** If a later round diagnoses a
   class that already has an open ticket, the AI appends its new evidence to that
   ticket rather than filing a second one (FREE-CODING.md's proliferation rule).
7. **A `capture-incomplete` verdict stops the round and files nothing.** That
   verdict means the reference itself is wrong, which is a different problem from
   an engine gap; filing it against the engine would be a false report and
   working its deltas would waste the round.
8. **The console runs the rail ([[REQ-255]]) read-only and displays its result**
   per iteration, so each round shows the current cross-site state rather than
   only this site's. The rail's *gating* use belongs to the free-coding session
   that implements a gap ticket, not to this loop.
9. **[run again] re-runs the reproduction with whatever has landed since**,
   appending the next iteration. It does not require that a ticket was
   free-coded — a round that produced no landed change simply reproduces the same
   numbers, which is itself information.
10. **Nothing advances without a human.** The loop does one iteration and stops,
    every time.
11. **The brief the AI is given is a durable, reviewable artifact** — a document,
    not a string buried in the console — distilled from [[DOC-19]] and our
    accumulated reproduction transcripts. It must carry at minimum:
    - **Transcribe from the captured DOM; never reconstruct from the screenshot.**
      This is the most-violated rule in every reproduction pass to date, and a
      loop driven by image comparison is exactly the shape that tempts it. It
      applies to the *diagnosis* as much as it would to a fix: a ticket whose
      evidence is a screenshot impression is not evidence.
    - **Read the diff's regions before its mean** — the average says whether
      something is wrong, the regions say where, and only the regions are
      actionable.
    - **What each fidelity verdict implies**, in particular that
      *capture-incomplete* means **stop** (behavior 7).
    - **Content completeness before pixels** — a dropped heading or image matters
      more than a colour that is slightly off.
    - **Diagnose the engine, never the site.**
    - **The xgd rules that bind ticket creation**: create at `draft`, never at a
      `ready_*` status; title by area, not by type; one ticket per gap class.
12. **Every iteration runs a fresh `1c` process** ([[REQ-254]] behavior 7), so a
    change that landed between rounds actually takes effect rather than being
    masked by a cached module graph.
13. **Home pages only.**

## Isolation ([[EPIC-12]] §8.6)

14. Risk 2 — the AI's edits reaching deployable code — is dissolved by behavior
    3: the AI authors no code, so there is nothing of its authorship to reach
    anywhere. Engine changes arrive by free coding, through the same review, UAT
    and reconciliation path as every other change in the project. **No part of
    the console invokes a deploy**; deploying stays a separate, explicit, human
    act.

## Out of scope

- **Letting the AI edit code directly.** That is [[EPIC-12]] §9 Q8 — a v2
  decision that needs evidence (rounds where the free-coded fix matched the
  proposal and the numbers moved as predicted), deliberately not taken here.
- Letting it run unattended across many sites.
- Loop 2 (smoothing one customer's site in session) — [[EPIC-12]] §7.2.
- Pages other than the home page.

## Testable at the end

Run one full round on a stored reference: the AI's transcript appears on the page
as it works; a gap ticket exists, is linked from the iteration, and carries a
named residual class, the reference, real `check_fidelity` / `regions` /
`values-diff` evidence, a hypothesis and a proposed change. Free-code that
ticket, press [run again], and confirm "Iteration 2" appears with diff numbers
that have moved from Iteration 1's.

Then the negative cases, which matter more:

- **Point it at a reference whose capture is incomplete** and confirm the round
  stops and **files nothing**.
- **Run a second iteration whose residual is the same class as the first** and
  confirm it appends to the existing ticket rather than filing a duplicate.
- Confirm no ticket is ever created at a `ready_*` status, and that the working
  tree is unchanged after a round.

Related: [[EPIC-12]] §7.1, §7.3, §7.4, §7.5, §8.1, §8.2, §8.5, §8.6 ·
[[REQ-254]] · [[REQ-255]] · [[DOC-19]] · [[DOC-17]] §D
