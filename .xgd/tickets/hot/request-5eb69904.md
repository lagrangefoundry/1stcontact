---
uid: request-5eb69904
id: REQ-427
type: request
title: 'Critic: an independent review of the work, due at the end of each big build
  and before publishing'
created_by: EPIC-19
created_at: '2026-10-22T20:43:06.020897+00:00'
updated_at: '2026-10-22T20:43:06.020897+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
---

## Why (operator, 2026-10-21/22, EPIC-19)

The consultant signs off its own work. Its context is full of machinery and its
own momentum, so it judges a page by why it made it rather than how a customer
sees it (Ariel's run: an adage for a headline; Bob's salon 2: the prices page).
Measurable layout defects are the layout check's job (REQ-415, BUG-238); this
ticket is for **judgement**: does the headline sell, does the hierarchy read,
does it look like this trade, does the customer's path to calling work.

## What the critic is

1. **A tool the consultant calls**, `critique(focus?)`, run as a delegated
   session (the `Delegate` mechanism): its own priming (the rubric), a
   strong model (its own backend entry in `backends.json`, Opus, separate
   from the builder model), **read-only** grant, private context, and a
   report returned as the tool result. It never speaks in the chat.
2. **What it is given:** the brief and the result only — the positioning card,
   hearted notes, decisions, comps conventions, the previous critique's
   findings, and screenshots of the changed pages at desktop (1280), tablet
   (~900) and phone (375). **Never** the consultant's transcript or reasoning.
3. **Lenses, one call:** a single call with all four rubrics (start here,
   split only if a lens gets crowded out):
   - **Purpose** — does the site serve the business's goal; the customer's
     path from landing to calling.
   - **Messaging** — does the headline answer what the buyer is deciding;
     claims backed by proof; could the text belong to a competitor. With no
     confirmed positioning card or recorded fallback, the finding is that the
     card is missing — it does not guess.
   - **Style** — hierarchy, rhythm, contrast, brand presence, consistency
     between pages, the busyness the trade expects.
   - **Function** — contact routes, forms, navigation between pages.
4. **Its report:** at most three findings overall, ranked, each with an id,
   lens, severity, evidence (page, width, what is seen) and a suggested fix.
   "Good enough" is a valid report.

## When it runs (the host makes it due)

5. **Due** at three points, decided by the host, not the consultant:
   - the first draft finishing;
   - a set of looks being offered;
   - before "Ready to publish" (alongside REQ-415's looked-at gate).
   It may also be called at any time by the consultant.
6. **Hold:** while a critique is due, the consultant's hand-back is held,
   reusing REQ-415's "not done" continuation (REQ-409's `MAX_CONTINUATIONS`
   and spend ceiling), until the critique has run and every top finding has
   an answer.
7. **Every finding gets an answer**, recorded against its id: `fixed`,
   `decision` (it needs the client — recorded as an open decision on the plan,
   e.g. the headline), or `dismissed` with a reason. The hold lifts when
   every finding is answered.
8. **At most one re-check**, and only after a high-severity finding.

## What the client sees

9. Nothing called a critic (BUG-241 vocabulary). Only the single weakest
   point reaches the client, through REQ-408's weakest-point line.

## Measurement

10. Every critique and every answer is logged (turn log / activity log) so
    finding kinds can be counted across runs.

## Must verify first

- The critic's screenshots must reach the model **as images**. One delegated
  path serialises tool-result images into text (`box.run`); a critic on that
  path judges pages it cannot see.

## Deferred

- A persistent private critic session per site (needs lagrange-framework).
  Passing the previous findings in (item 2) covers "was it fixed?" for now.

## Test plan

- A scripted first draft finishing makes a critique due; the hand-back is held
  until a scripted critique runs and each finding is answered; then it hands back.
- The critic's request carries the brief, screenshots at three widths and the
  previous findings, as image blocks, and none of the consultant's transcript.
- An unanswered finding keeps the hold; `decision` adds an open decision on the plan.
- A critique and its answers appear in the log.
