---
uid: request-c1c5261a
id: REQ-256
type: request
title: 'AI iteration in the console: review the diff, change the engine, stop for
  the human'
created_by: EPIC-12
created_at: '2026-09-16T01:47:59.959791+00:00'
updated_at: '2026-09-16T01:47:59.959791+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
---

Parent: [[EPIC-12]] §8. Third of three. **Depends on [[REQ-254]] (the console) and
[[REQ-255]] (the rail).** The rail must already exist, and must already have been
seen to fail correctly, before this ticket lets anything edit code unattended.

## Goal

Put the AI into the console's loop — one iteration at a time, with a human
pressing the button between every round. This is loop 1 of [[EPIC-12]] §7: the
AI's job is to **improve the reproduction engine**, not to patch the site in
front of it.

We watch it work a few times before we let it run unattended.

## Behavior

1. **As soon as an iteration's links appear, an AI process starts**, prompted to
   review the diff and close the gaps. It is not started by a separate button.
2. **The AI's transcript streams onto the page** as it works, under that
   iteration, so the human can see what it is doing while it does it.
3. **The AI changes the reproduction engine's code**, not the reproduced site.
   A fix that makes this one site look better while leaving the engine unchanged
   is the failure this loop exists to avoid.
4. **A fourth link appears on each iteration: "what the AI changed"** — the
   actual code diff, alongside the original / reproduction / diff-images links.
5. **Each iteration's changes are committed to a scratch branch**, never to
   `main`, and nothing merges automatically. Every round is revertible on its
   own.
6. **Before the AI is allowed to finish, it must run the rail ([[REQ-255]]) and
   the rail must pass.** If the rail fails, **the AI does not get to finish** —
   the iteration is reported as failed on the page, with what the rail said.
7. **When the AI finishes, a [run again] button appears.** Pressing it re-runs
   the reproduction **with the AI's changes in place**, producing the next
   iteration.
8. **Nothing advances without a human pressing the button.** The loop does one
   iteration and stops, every time.
9. **The brief the AI is given is a durable, reviewable artifact** — a document,
   not a string buried in the console — distilled from [[DOC-19]] and our
   accumulated reproduction transcripts. It must carry at minimum:
   - **Transcribe from the captured DOM; never reconstruct from the screenshot.**
     This is the most-violated rule in every reproduction pass to date, and a
     loop driven by image comparison is exactly the shape that tempts it.
   - **Read the diff's regions before its mean** — the average says whether
     something is wrong, the regions say where, and only the regions are
     actionable.
   - **What each fidelity verdict implies**, in particular that
     *capture-incomplete* means **stop**, because the reference itself is wrong
     and working its deltas wastes the round.
   - **Content completeness before pixels** — a dropped heading or image matters
     more than a colour that is slightly off.
   - **Fix the engine, never the site.**
10. **Every iteration runs a fresh `1c` process** ([[REQ-254]] behavior 7), so the
    AI's edits actually take effect in the next round rather than being masked by
    a cached module graph.
11. **Home pages only.**

## Isolation ([[EPIC-12]] §8.6)

12. The AI edits the engine under `tools/generate/`, which `apps/control-app`
    imports directly — so these are edits to **deployable code**. The protections
    are the scratch branch (5), the rail including its Worker build check (6),
    and the fact that **no part of the console invokes a deploy**. Deploying
    stays a separate, explicit, human act.

## Out of scope

- Letting it run unattended across many sites. That is the *next* decision, taken
  after we have watched this work — deliberately not in this ticket.
- Loop 2 (smoothing one customer's site in session) — [[EPIC-12]] §7.2.
- Pages other than the home page.

## Testable at the end

Run one full round on a stored reference: the AI's transcript appears on the page
as it works, the "what the AI changed" link shows a non-empty code diff, the rail
runs and passes, [run again] appears, and pressing it produces an "Iteration 2"
whose diff numbers have moved from Iteration 1's.

Then the negative case, which matters more: **make the AI's change break the
rail, and confirm the iteration is reported as failed and the AI does not get to
finish.** And confirm the scratch-branch commits are individually revertible.

Related: [[EPIC-12]] §7.1, §7.4, §7.5, §8.1, §8.5, §8.6 · [[REQ-254]] ·
[[REQ-255]] · [[DOC-19]] · [[DOC-17]] §D
