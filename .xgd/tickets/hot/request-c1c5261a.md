---
uid: request-c1c5261a
id: REQ-256
type: request
title: 'AI iteration in the console: review the diff, file a gap ticket, stop for
  the human'
created_by: EPIC-12
created_at: '2026-09-16T01:47:59.959791+00:00'
updated_at: '2026-09-16T18:16:25.948348+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-e86a4f31
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

## Behaviour the above implies

Recorded here because it is asserted by test and would otherwise look
unmotivated.

15. **The evidence is produced by `1c gate`, which replaces `1c diff` as the
    iteration's last reproduction step.** `1c gate` runs the structural gate,
    the value gates and the perceptual eye together and reconciles them — it
    reaches the same `gate-core` reconciliation `check_fidelity` does, so it is
    that verdict by construction — and it writes `gate.json`, `values-diff.json`
    and the same `regions.json`, heatmaps and region crops `1c diff` wrote, into
    the iteration's own evidence directory. Behaviours 4 and 7 both need the
    verdict; keeping `1c diff` and adding `1c gate` beside it would render and
    photograph the page twice to produce one report.
16. **The verdict is read by the console, not by the AI.** Behavior 7's stop is
    structural: the console reads `gate.json` and, on `capture-incomplete`,
    never starts an AI process at all. A rule the AI is merely *told* is a rule
    it can get wrong on exactly the round where getting it wrong is most
    expensive — a false report against the engine. The brief still carries the
    rule (behavior 11), because the AI has to understand what it is looking at
    on the rounds it does run.
17. **The AI is a `claude -p` process whose tool allowlist contains no way to
    author code.** Reading tools to read the evidence, and `Bash` narrowed to
    `xgd ticket …` to file the deliverable. Edit, Write, NotebookEdit and
    general `Bash` are denied by name. Behavior 3 is therefore a property of the
    process rather than a hope about the prompt.
18. **Two falsifiers are checked after every round and named on the iteration.**
    The working tree is compared before and after the AI ran — a round that
    changed a tracked file is reported as a violation (behavior 3) — and the
    filed ticket's status is read back, so a ticket that is not at `draft` is
    reported as a violation (behavior 4). Shown on the page, not merely logged:
    a check whose failure is invisible is not a check.
19. **What the AI was asked, and what it did, are artifacts of the round.** The
    prompt is written to the iteration's own directory as `ai/prompt.md` before
    the process starts and the transcript to `ai/transcript.txt` as it arrives,
    so both survive a restart of the console like every other artifact
    ([[REQ-254]] requirement 33) and both are reviewable after the fact.
20. **The AI's outcome is a JSON block in its final message**, carrying the
    status, the residual class, the ticket id and uid, and a summary. The
    console does not mine the transcript for a ticket number — a claim it is
    told is checkable (behavior 18), a claim it guessed is not.
21. **The classes that already have tickets are kept in the console's own
    workspace**, at `storage/tmp/repro-console/gap-tickets.json`, one entry per
    class carrying its ticket, the references that exhibited it and the
    iterations that found it. Behavior 6 needs the AI to know what is already
    filed, and the console cannot ask xgd that question without inventing a
    label convention; this is the console's memory of what this loop has filed,
    and it is what the next round's prompt carries.
22. **The rail is resolved, not assumed.** Behavior 8's command belongs to
    [[REQ-255]], which has not landed. The console runs `$REPRO_CONSOLE_RAIL` if
    it is set, otherwise `bin/rail` if it exists, and otherwise reports
    `regression rail: not available` — which is honest, where a green line
    nothing produced would not be. The rail's result is read-only here and its
    failure never fails the iteration: it is cross-site information for the
    round, not this round's gate.
23. **A run stays "running" until the AI round ends**, so [run again] cannot
    start a second round on top of a diagnosis still in flight (behavior 10).
24. **The gap-ticket link renders the ticket through `xgd ticket get`** rather
    than reading `.xgd/tickets/`. A link that reached into the ticket store
    would be a second reader of a layout xgd owns, and would go stale the first
    time xgd moved a ticket between tiers.

## Implementation decisions

- **The AI process is the `claude` CLI already installed on the operator's
  machine**, spawned exactly as `1c` is — no npm dependency is added, and the
  console keeps its single declared dependency (`vite`). It is reached through
  an injected `AiRunner`, the same seam `StepRunner` gives the reproduction
  steps, so the console's whole surface is exercisable without spending a
  token. `$REPRO_CONSOLE_AI` names a different executable and
  `$REPRO_CONSOLE_AI_MODEL` a different model, for the operator who wants
  either.
- **The brief is `tools/repro-console/brief/DIAGNOSE-THE-GAP.md`** — a file in
  the repository, reviewed in the diff that changes it, distilled from
  [[DOC-19]] and [[EPIC-12]] §7.4, §7.5, §8.2 and §8.5. The console reads it at
  the top of every round and pastes the round's own evidence beneath it.
- **The transcript streams through the poller the console already has.** The
  page carries a `<pre>` per iteration; the running round's tail is served in
  the poll payload and written into that element, and the finished round's is
  rendered server-side from disk on the next reload. No second transport, no
  client build step.

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