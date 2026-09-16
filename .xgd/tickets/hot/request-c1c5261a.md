---
uid: request-c1c5261a
id: REQ-256
type: request
title: 'AI iteration in the console: review the diff, file a gap ticket, stop for
  the human'
created_by: EPIC-12
created_at: '2026-09-16T01:47:59.959791+00:00'
updated_at: '2026-09-16T19:35:27.446280+00:00'
completed_at: null
last_field_updated: body
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
4. **The AI's deliverable is a gap ticket** against the reproduction engine, at
   `status=draft` — never at any `ready_*` status, which would spawn an
   automated pipeline against it. What the AI hands back is the ticket's
   **content**; the console is what runs `xgd ticket create` (see requirement
   17, which is why). The ticket must carry, so the claim is checkable without
   re-deriving it:
   - the **named residual class** (what kind of gap this is, not just "the hero
     is wrong");
   - **which stored reference(s)** exhibit it;
   - the **evidence** — the `check_fidelity` verdict, the `regions` entry, the
     `values-diff` lines. Nothing that could only be read off a screenshot;
   - the **hypothesis** about which part of the engine is at fault;
   - the **proposed change**.
5. **A further link appears on each iteration: the ticket the AI filed**,
   alongside the original / reproduction / diff-images / L1-document links
   ([[REQ-254]] already added the fourth), so it is the fifth. Once that ticket is
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
17. **The AI is a `claude -p` process with reading tools and nothing else, and
    the console files the ticket.** The round gets `Read`, `Glob` and `Grep`;
    every tool that can write a file, run a command, reach the network or spawn
    an agent whose tool set is not this one is **denied by name**.

    The deny list is the gate, and this was **measured rather than assumed**:
    with `Bash` merely absent from the allow list and the permission mode at
    its default, a round asked to run `echo` in a shell ran it and reported no
    denial. An allow list that does not deny is a statement of intent, and
    behavior 3 needs a property.

    So the round cannot run `xgd` either, and the deliverable is the ticket's
    content rather than a command. Two things follow, and they are the point
    rather than a side effect:
    - **The console writes `status: draft`**, so behavior 4's "never at a
      `ready_*` status" is structural — there is no status left for a round to
      get wrong.
    - **The body goes through `--body-file`**, not `--body`: a gap ticket's
      body is multi-line markdown quoting values out of `values-diff.json`, and
      passing that as one argument would make its correctness a question about
      quoting rather than about what the round found.

    The deny list is enumerated, so it can go stale as the CLI grows tools.
    That is an accepted cost, not an oversight: the alternative is trusting an
    allow list that was measured not to gate.
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
    status, the residual class, a summary, and — per status — either the
    **ticket to create** (type, title, body) or the **evidence to append** to
    the class's existing ticket. The **id and uid are the console's to fill in**
    once it has filed, because the round has no tool that could have created a
    ticket; a round that names one is not trusted for it. The console does not
    mine the transcript — a claim it is told is checkable (requirement 18), a
    claim it guessed is not.

    The **last** fenced block wins, because a round that shows the shape before
    filling it in must not have its example read as its answer. A claim that
    does not carry what its status requires is a **failed** round rather than a
    partly-honoured one: `filed` without a ticket body would file an empty
    ticket and `appended` without evidence would append nothing, and either is
    worse than saying the round produced no answer.
21. **The classes that already have tickets are kept in the console's own
    workspace**, at `storage/tmp/repro-console/gap-tickets.json`, one entry per
    class carrying its ticket, the references that exhibited it and the
    iterations that found it. Behavior 6 needs the AI to know what is already
    filed, and the console cannot ask xgd that question without inventing a
    label convention; this is the console's memory of what this loop has filed,
    and it is what the next round's prompt carries.
22. **The rail is [[REQ-255]]'s, called read-only — not reimplemented, and not
    probed for.** This was written while [[REQ-255]] had not landed and said
    the console should look for a rail rather than hardcode one; it has since
    landed, and its own design names this console as a consumer and exposes its
    report as data for it. So the console calls it directly. Three things
    follow:
    - **The round runs the `references` phase only** — the cross-site
      comparison, which is the one behavior 8 is about. The rail's other three
      phases (typecheck, worker build, the test suite) gate the *checkout*, and
      re-running them between two iterations that changed nothing would spend
      minutes per round to re-answer a question no reproduction asked. The
      narrowing is never silent: the rail reports what it did not cover and
      that carries onto the page.
    - **Its failure never fails the iteration.** It is cross-site information
      for the round, not this round's gate.
    - **Nothing green is shown that nothing produced.** A checkout with no
      recorded bar cannot say "no worse", and the rail says so rather than
      passing by default. `$REPRO_CONSOLE_RAIL=off` is the one knob — for the
      operator who does not want to wait for it — and the page says the rail
      did not run.

    The rail and the console also now share one definition of "run a command
    and read what it said" (`run.ts`), rather than this ticket adding a second
    copy of it beside [[REQ-255]]'s.
23. **A run stays "running" until the AI round ends**, so [run again] cannot
    start a second round on top of a diagnosis still in flight (behavior 10).
24. **The gap-ticket link renders the ticket through `xgd ticket get`** rather
    than reading `.xgd/tickets/`. A link that reached into the ticket store
    would be a second reader of a layout xgd owns, and would go stale the first
    time xgd moved a ticket between tiers.

25. **A round that cannot be checked is reported as failed, not as filed.** If
    xgd refuses the create, or the round claims `filed` without handing back a
    ticket, or it claims `appended` against a class with no ticket on record,
    the iteration says so and **no fifth link appears**. A link standing for a
    ticket that does not exist would be worse than the absence it replaces, and
    a green `filed` that requirement 18 has nothing to read back is a claim
    nothing can falsify.

26. **One ticket per gap class is decided by the console, not by the round.**
    The registry (requirement 21) is what knows what has been filed; a round
    that names a class already on record gets an append even when it asked to
    file. The append is recorded in the registry too, so the references and
    iterations a class accumulates are the frequency signal [[EPIC-12]] §7.3
    wanted, arriving for free.

27. **The round's answer belongs to the round.** The console works on a copy of
    what the `AiRunner` handed back, and everything it fills in afterwards —
    the ticket it filed, the status it read back, the violations it found —
    lands on that copy. A runner that returns a value it also holds must not
    find it rewritten underneath it.

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