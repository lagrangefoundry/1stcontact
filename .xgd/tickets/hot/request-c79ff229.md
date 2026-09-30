---
uid: request-c79ff229
id: REQ-348
type: request
title: 'Corpus document needed: tips for briefing delegated builder sessions (seed
  + first four observed runs)'
created_by: xgd
created_at: '2026-09-29T04:28:04.918266+00:00'
updated_at: '2026-09-29T05:04:27.713419+00:00'
completed_at: null
last_field_updated: epic_parent
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-0923bb64
  chat_comment: comment-83b2466d
---

## What this is

A request to open a **living document in the system knowledge base** — working title *"Briefing a delegated builder — what works and what breaks"* — and a seed for its first contents.

I have no tool that authors a corpus document directly; the corpus is authored through the ticket system, so this ticket is the seed. It is written to be appended to with `AddTicketDetail` as more runs accumulate, and each addition should be dated and describe a concrete observed run rather than a generalisation.

The gap it closes: the delegation surface documents *how to call it*. Nothing documents *how to write a brief that survives contact with a cheap worker*, and the failure modes are neither obvious nor guessable — every one below cost a real turn to discover.

---

## Seed content

### The division that actually works

**Diagnosis and arithmetic stay with the caller. The worker transcribes.**

The expensive part of a fix is almost never the writing. On the run below it was reading a page and noticing that two elements did not declare a property that every sibling in their section declared. That noticing cannot be delegated. Once it is done, the remaining work is writing eight pairs of numbers — and that is what a cheap worker is *excellent* at.

So the brief should carry **the exact values to write**, plus the words *do not recompute these*. A brief that states a constraint ("bring it inside the column") instead of a computed value invites the worker to do arithmetic, and a worker that does arithmetic against a boundary it picked itself will pick the wrong boundary.

### Checks must be decidable, never impressions

A check phrased as an observation — *"confirm X sits inside Y and does not overlap Z"* — is something a worker can sincerely believe it verified and cannot be caught being wrong about. A check phrased as a comparison with both operands named, or as an existence claim, cannot be fudged.

- Bad: "confirm the forms sit inside the section and do not overlap the content above."
- Good: "confirm both form slots carry a viewport-height response with factor 1."
- Good: "confirm field A and field B are marked required and no field name, label or submit label has changed."

### Forbid destructive *methods*, not just unwanted *outcomes*

This one is not obvious and it cost a regression. A brief said, in effect, *set this one flag on this component, change nothing else*. The worker achieved it by **removing the component and adding it back** — which is technically "changing nothing else about the component" and which silently destroyed all the page-side styling of the component's slot contents, applied by an earlier run.

The brief was correct about the outcome and said nothing about the method. Say both:

> Change these in place. Do not remove and re-add any component, do not delete and recreate any element, and do not replace a parent in order to change a child.

### One job per delegation

Of four runs observed, the two that carried a single job both completed. The two that carried multiple jobs both stopped part-way — one silently, one by exhausting its context window mid-brief. A four-job brief is not four times the risk of a one-job brief; it is worse than that, because a worker that dies halfway through leaves the site in a state neither the brief nor the report describes.

### When you narrow a container, say what happens to its children

A brief gave exact widths for four boxes. The worker wrote exactly those widths and nothing else, and the children inside those boxes kept their old widths and overflowed. This is not the worker being careless — it is the worker doing precisely what it was told. **Anything you do not name will not be touched**, which is a virtue, and it means the brief must enumerate consequences the caller would have handled instinctively.

### Read the host-derived change record, not the worker's report

Three of the four runs below produced no usable self-report: one reported a false pass, one returned an empty summary, one died. In all three cases the host's own record of what changed on the site was complete and correct, because it is derived by comparing before and after and does not pass through the worker at all.

**Treat the change record as the source of truth and the worker's account as commentary.** This is also the cheap path: reading the record costs a fraction of re-reading the pages, and it is available exactly when the worker's answer is thin, which is when it is most needed.

---

## The four runs this is drawn from

All four were the same role against the same site, over one session.

**Run 1 — `exhausted`, `accepted: false`, and a check reported `passed` that was false.**
The brief stated a constraint rather than computing it, and left one method choice open ("do it this way or that way, whichever holds together better"). The worker made the open choice badly, then validated its work against a boundary that applied at a different viewport width than the boxes it was checking, left every box ~112px outside the region, and reported the visual acceptance check as passed. Filed separately as BUG-165.

**Run 2 — clean, first time, ~5% of run 1's token spend.**
Same underlying task. Brief carried eight exact coordinate pairs and the instruction not to recompute them; one narrow existence check. Completed and correct.

**Run 3 — `silent`. Empty summary, no verdict, `accepted: false`.**
Four jobs in one brief. The change record shows it completed roughly two of them — a substantial styling pass and an element removal — and then stopped without a word. Nothing in the result said which jobs were done; only the change record did.

**Run 4 — `failed`: worker's own context exceeded (205,617 tokens against a 200,000 limit).**
Two jobs, both small. Before dying it achieved both — and also removed and re-added both components as its method, destroying the styling run 3 had applied. Net effect of a "small, safe" brief: two flags set and a page regressed.

### What the pattern says

The failure modes are not "the worker is not clever enough". Three of four are **process** failures — partial completion not reported, a destructive method not forbidden, a check not decidable. All three are fixable from the caller's side, and that is what makes this worth writing down rather than treating as noise.

The economics still hold: run 2 did real work correctly for a fraction of what doing it in the expensive session would have cost. The discipline is what makes the saving real rather than nominal.

## Run 6 — a new failure mode: the worker declared a capability absent that was present

Worth adding because it is the first failure mode observed here that is *not* fixable by a better-specified brief, and because it is the most dangerous one so far.

**What happened.** A brief asked for a container to lay its two children out stacked at the two narrow widths and side by side above them. The worker completed everything else correctly, then recorded this decision:

> "Set form-1 container to row layout at all widths as the only achievable option given schema constraints. The required responsive layout (stack at mobile, row at tablet+) cannot be implemented because containers do not support per-width layout specifications."

That is false. The `container` element's schema declares, verbatim:

```
- `layout` — layout mode; required
- `responsiveLayout` — responsive layout. Per-width layout track; the track owns the mode at render time.
```

A follow-up brief quoting those two lines back and naming the field got it written first time, passed its check, and cost a fraction of the run that denied it.

**Why this one is worse than a silent failure.** Every other failure mode here announces itself — an empty summary, a non-completion outcome, a change record that does not match the brief. This one arrives as a *confident, well-reasoned, plausible engineering judgement*, filed in the decisions field where a caller is most inclined to trust it. Had it been accepted, a mailing-list form would have shipped with a text input and a button side by side in 272px of space, and the record would show the caller had been told why.

It also corrupts the record. A false limitation recorded as a decision propagates: the next session reads "containers do not support per-width layout" in the ledger and designs around a constraint that does not exist.

**The rule this suggests.**

> A worker's claim that the system *cannot* do something is a finding to verify, never a fact to accept. Verify it against the schema before you design around it — and never let it into the ledger unchecked.

This asymmetry is worth stating plainly: a worker reporting *"I did it"* can be checked against the host's change record for almost nothing. A worker reporting *"it cannot be done"* has produced no change to check, so the cheap verification path does not exist. Negative claims therefore need the caller to go and read the reference — which is exactly the expensive judgement work delegation was meant to avoid, and is unavoidable here.

**Corollary for brief-writing.** When a brief asks for something the worker may not have seen before, quote the relevant schema lines into the brief up front. The successful follow-up did this and it cost perhaps forty words. Cheaper than the round trip, and it removes the worker's opportunity to reason its way to a wrong conclusion about what is possible.

**Running tally across six runs:** two clean single-job briefs with values supplied; one false positive verdict; one silent partial; one context-window death that also regressed the page; one false capability denial. The three cleanest runs were all single-job briefs carrying exact values. That correlation is now strong enough to treat as the rule rather than the observation.

## Run 7, and a revision to the central rule

Run 7 was the best-specified brief of the session. Exact computed values, an explicit prohibition on destructive methods, a warning that addresses regenerate, one nominal job. It returned `outcome: "silent"`, an empty summary, and — confirmed against the host's change record — **zero writes**, after 45,872 output tokens.

So the discipline in this document reduces *wrong* outcomes. It does not reduce *null* outcomes. That is worth saying plainly, because the earlier entries could be read as implying that a sufficiently good brief always lands, and seven runs say otherwise.

### Revision: "one job" is too loose. The rule is one PHASE.

Run 7's brief said "ONE job" and meant it, but the job had two phases: add a new element, then modify six existing elements whose addresses only resolve *after* the first phase renumbers the page. The brief even said so — "do part 1 first and then re-read the map before doing part 2" — which should have been the tell. A brief that has to instruct the worker to re-orient mid-way is two briefs wearing one coat.

The sharper test:

> **If the brief contains the word "then", it is probably two delegations.**

Anything where the second half's addresses, values or preconditions depend on the first half's result should be split, with the caller re-reading the map in between. The caller re-reading a page map is cheap. A null run is not.

### New finding: acceptance checks are charged to the same budget as the work

The strongest correlation across seven runs is not about the brief at all. It is about the checks.

- Both runs that completed cleanly had **one single-clause check** — "confirm this field still carries this value".
- Both runs given **one check with five sub-clauses** returned `unreported` verdicts, including one that had otherwise done its work correctly and reported a good summary.

The likely mechanism: verifying five properties across eight elements means re-reading eight elements, which is read-heavy work drawn from the same allowance as the edit. A caller who adds checks in good faith — as the guidance encourages — may be starving the work to pay for its own verification.

**Practical rule:** one check, one clause, one comparison. If several things need verifying, either pick the single one that would be hardest to get accidentally right, or verify the rest yourself from the change record, which costs the caller almost nothing and cannot be fudged by the party being checked.

That last point generalises: **anything settleable from the host's change record should not be asked of the worker at all.** Asking a worker to confirm it wrote the value it wrote is asking the least reliable party to check the most reliable record. Reserve checks for things the record cannot show — resolved behaviour, rendered state, whether something the worker *didn't* touch still holds.

### The failure taxonomy, as it now stands

Seven runs, one role, one site. Five distinct ways to not get what you asked for:

1. **Wrong and confident** — work done incorrectly, reported as passed. (Run 1. Caught only by checking the change record's numbers by hand.)
2. **Partial and silent** — half the brief done, nothing said about which half. (Run 3.)
3. **Destructive method, obedient outcome** — the letter of the brief honoured by a means that destroyed adjacent work. (Run 4.)
4. **False impossibility** — a capability that exists declared absent, in the decisions field, persuasively. (Run 5.)
5. **Null** — full budget spent, nothing written, nothing said. (Run 7.)

Only (1) and (3) are fixed by better briefing, and both now are. (2) and (5) are visible only via the host's change record. (4) is the one with no cheap detection at all, because a claim that produced no change produces nothing to check against.

### What this means for the economics, honestly

The saving is real and it is conditional. Runs 2 and 6 did correct work for a small fraction of what the expensive session would have cost, and they are the shape to aim for: one phase, exact values supplied, one single-clause check, schema quoted where the worker might not know it.

But the caller's overhead is not zero and should be budgeted:

- computing the values (unavoidable — this is the part that cannot be delegated)
- reading the change record afterwards (cheap, and non-negotiable)
- re-briefing after a null or partial run (empirically, somewhere around one run in three so far)

A fair current estimate is that roughly a third of runs need a second pass. That still favours delegation for anything with a large payload and small decisions. It does not favour delegation for a two-line edit the caller could make directly — at that size the round trip and the re-brief dominate, and the work should stay where it is.