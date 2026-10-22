---
uid: request-5eb69904
id: REQ-427
type: request
title: 'Critic: an independent review of the work, due at the end of each big build
  and before publishing'
created_by: EPIC-19
created_at: '2026-10-22T20:43:06.020897+00:00'
updated_at: '2026-10-22T21:40:12.386368+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e8d7a090
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

## What landed (free-coded, 2026-10-22)

**The critic is its own one-turn session, not a `Delegate` call.** The
`Delegate` brief is text only, so a critic opened through it could not be handed
pictures as images (the "must verify first" item). The host opens the critic the
way the delegation surface opens a worker: a `critic` role on the site's session
manager with its own priming (the rubric, `priming.json` `critic_priming`), its
own backend entry `claude_critic` (Opus 5.5, `backends.json`, priced in
`prices.json`), **no tools** (read-only), a private session closed after one
turn. Its opening turn is the brief plus image blocks (the framework's neutral
`{type:'image', mediaType, data}` shape, registered with the adapter's vision
capability). Its spend is charged to the message's REQ-409 meter and attributed
to the consultant's session.

**What it is handed** (`critic-core.ts` `criticBrief`, from the plan alone): the
brief, the positioning card and whether the client confirmed it (or it is the
recorded fallback), the hearted notes, the story-board headline, the decisions,
the comps note, its previous review's findings with their answers, and the
consultant's `focus` if given. Pictures: pages changed since the last review
(every served page the first time; home or the focused page first; at most 3),
each at desktop 1280, tablet 768 (the camera's tablet preset, standing in for
"~900") and phone 375, all tiles at low detail. Its pictures do not count as
the consultant's REQ-415 looks. Never the consultant's transcript.

**Report.** One JSON object `{verdict, findings[]}`; at most 3 findings, ranked,
each with lens (purpose/messaging/style/function), severity (high/medium/low),
page, width, what is seen and a fix. No findings plus a verdict is "good
enough". An unreadable reply is refused `CRITIC_FAILED` and nothing is recorded.

**Plan surface** (`plan-surface.json`, group `Critique`, granted to the
consultant only where the host has a browser and a plan):
- `critique(focus?)` — runs the review, records it as `C<n>` with findings
  `C<n>.<k>`, answers the findings.
- `answer_finding(finding, answer, note?, decision?, title?)` — `fixed`,
  `decision` (opens the named plan decision, or adds a new one under the lens's
  area; a decision the client already settled is left as theirs), or
  `dismissed` (reason required in `note`).

**Due points, decided by the host** (`plan.fields.critique.due`):
- the first builder session completing (`first_pass_complete`, the same
  milestone REQ-408's weakest-point check uses);
- `show_client` with target `looks` — once per page whose looks are offered;
- before publishing — the client opening Publish, or any refused attempt to
  mark Ready to publish. `set_stage(ready_to_publish)` is refused
  `NOT_CRITIQUED` until a review before publishing has run and every finding is
  answered (checked after REQ-415's `NOT_LOOKED`). A review run with nothing
  due while Finishing touches / Ready to publish is under way counts as the
  pre-publishing one.

**Hold.** While a review is due or a finding of the latest review is
unanswered, the consultant's hand-back is carried on by the host
(`continuedTurn`) with `critique-continuation-cue`, on REQ-409's
`MAX_CONTINUATIONS` and spend ceiling — after any REQ-415 layout faults, which
are owed first. The plan entry also says what is owed ("Review: …") while it is.

**Re-check.** When the last finding of a review is answered and a high-severity
one was `fixed`, exactly one re-check falls due; a re-check never makes another.

**What the client sees.** Nothing called a critic: the critique is kept off the
client's plan panel (`/api/plan`), and the consultant is told the top finding is
the weakest point it names to them (REQ-408's line).

**Measurement.** Every review, finding and answer is kept on the plan's
`critique` record (`runs[]`: id, time, trigger, pages, verdict, findings with
answers and timestamps), and each `critique`/`answer_finding` call is in the
tool-call audit.

**Changed elsewhere.** REQ-415's ready-to-publish UAT now also calls `critique`
before marking the stage, since a deployment with a browser holds publishing for
the review too.

## UATs

`tests/test_UAT_FC_REQ-427_the_critic.workers.test.ts`:
- a first draft holds the hand-back until it is reviewed and every finding is
  answered; `decision` opens a plan decision; nothing about it reaches the
  client's panel;
- the critic is handed the brief and pictures at three widths as image blocks,
  focus page first, on its own backend, with no tools and none of the
  conversation;
- an unanswered finding keeps the hold; a fixed high-severity finding makes one
  re-check due, which is handed the previous findings and their answers;
- Ready to publish is refused `NOT_CRITIQUED` until the review before publishing
  has run.
