---
uid: comment-91b0ef0c
id: COMMENT-3010
type: comment
title: Comment on epic EPIC-12
created_by: xgd
created_at: '2026-09-16T01:00:43.968268+00:00'
updated_at: '2026-09-17T21:40:41.055152+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-bf282b3d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "bcaef6cd-c3da-4c91-9d86-683675a23b15",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="76043dc9-07c6-4aaa-817d-9d36240e5d1e-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T00:59:52.336164+00:00" -->
#### You
Please review the chat sessions. I have had a few discussions about the site duplication capability and why/whether we need it. In the most recent we came to the conclusion that there is an important cohort of customers who have an existing site that they are happy with but want to come over the 1stcontact for our other capabilities. We decided that site duplication was necessary for those customers (or at least some of them).

The idea was that we extend the duplication machinery to cover the to 5-10 site tools to a reasonable degree.

Thus far our site reproduction has involved manual checks. Meaning: attempt reproduction -> human (me) looks finds errors -> fix errors -> loop. 

With the tools we have for comparison I think it would make sense for the AI to do a few rounds on its own say 2-3 to get to the point where it thinks it has it nailed before getting a human in.

This epic is about the work in this area and how we should take it forward.

<!-- xgd-turn id="76043dc9-07c6-4aaa-817d-9d36240e5d1e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:06:49.322498+00:00" -->
#### Claude
I've reviewed the relevant sessions. The key one is **CHAT-21 "The design conversation"** (2026-08-20/21) — that's where the cohort argument and the reproduction reframe were settled. Let me write the epic.

Epic written to `EPIC-12` (title kept as you set it, status left at `draft`). Here's what the review turned up and where I'd push back slightly on the framing.

## Where the decision actually lives

The discussion you're remembering is **CHAT-21 "The design conversation"** (2026-08-20/21), not CHAT-29. Worth knowing: **CHAT-29 "The future of reproduction" has no transcript at all** — an empty chat ticket. It's referenced from CHAT-21 as though it holds content, so anything that reads like a CHAT-29 conclusion is actually CHAT-21 quoting it.

CHAT-21 settled two things beyond the cohort argument:

**Duplication's job is consent, not fidelity.** It's how you show someone a change to their own site before they've agreed to move. That reframe sets the bar at *recognisable-and-improvable*, which is a categorically cheaper target than the [[DOC-15]]/[[DOC-21]] flywheel's perceptual-similarity standard — and it's why this can proceed without that research programme landing.

**And it argued the existing-site owner is the *better first market*, not the deferred one.** Higher intent, diagnosable in fifteen minutes from real data, better willing-to-pay, and they're the cohort that actually needs the other limbs. That's a stronger claim than "some of these customers need duplication," and it's worth deciding whether you still hold it.

## One correction to the shape of the work

You described it as *extending the duplication machinery to cover the top 5–10 site tools*. CHAT-21's Elementor evidence suggests that's not quite it — and the difference is a large cost saving.

Elementor's per-page stylesheet is entirely keyed by element ID (53 element-keyed selectors on your friend's page), and every one of those IDs is in the markup as `data-id`. The style-to-element mapping isn't inferred from geometry, it's handed to you exactly. So it's not "make the generic fold better" — it's **a builder-aware transform layer that runs ahead of the generic fold**, roughly fifteen or twenty deterministic per-widget mappings per builder. Detection is free (`<meta name="generator">`), coverage becomes countable (% of widget vocabulary handled), and the generic fold stays as the fallback for unrecognised sites.

**And nothing in the capture pipeline reads the generator today.** No meta check, no fingerprinting. That's the cheapest ticket in the epic and it gates everything else.

## On the 2–3 self-check rounds

The building blocks are already there: `check_fidelity` runs the structural gate, value gates and pixel comparison together and reports what it means when they *disagree* — `pass` / `reproduction-wrong` / `capture-incomplete` / `unexplained-disagreement` / `structural-failure`, plus a `nextStep`. `compare` returns ranked regions, largest first. What's missing is the harness around them.

Three design points I'd hold firm on:

- **Non-convergence must be a first-class outcome.** "I can't close this, here's the specific residual and my hypothesis" is *valuable output* — it's a framework-gap report. A loop that only knows how to succeed will fake success on round 3.
- **`capture-incomplete` must short-circuit.** The reference being wrong is a different problem from the reproduction being wrong, and working deltas against an invalid oracle wastes the budget. That verdict already exists; the loop has to honour it rather than iterate through it.
- **The risk worth naming**: a self-correcting loop driven by *screenshot comparison* is precisely the shape that tempts reconstruct-from-memory — [[DOC-19]]'s one rule and the documented #1 reproduction failure mode ([[DOC-17]] §D). `compare` says *where*; the fix must be authored from `values-diff`, not from the picture.

## What I'd do first

**Don't pick the 5–10 from market share — survey the beta cohort.** Capture everyone's current site and histogram the generators. It's two small tickets (generator detection, then the survey), it answers the ordering question with evidence rather than WordPress statistics, and it doubles as a qualification signal you can use in the free consultation from day one.

§7 of the epic proposes nine child tickets (A1–A6, B1–B3) but I haven't filed any — say the word and I will. There are also six open questions in §6; the two I'd most want your answer on are the operational acceptance bar (Q2) and whether duplication ever becomes the pitch (Q6), where CHAT-5 and CHAT-21 point in opposite directions.

<!-- xgd-turn id="cd8a5c4c-5222-40a6-bb2e-699d91584e4b-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:10:16.935211+00:00" -->
#### You
an empty chat ticket <-- you know the actual transcripts are stored in comments attached to the tickets

<!-- xgd-turn id="cd8a5c4c-5222-40a6-bb2e-699d91584e4b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:13:54.047394+00:00" -->
#### Claude
Let me actually check rather than rely on the file layout.

I was wrong — my file glob missed cold storage. Reading it now.

That's my error — the transcript is there, in cold storage my glob didn't reach. I should have used `xgd ticket get` on the `chat_comment` field rather than trusting a file search. Let me check what else I missed and fix the storage-path assumption.

Confirmed: cold tickets live in the `xgd-stable` git snapshot, not the working tree — `xgd ticket get` is the only reliable path. And CHAT-29 changes the epic materially. Rewriting it.

CHAT-29 is a full conversation — and it turns out to be the *origin* of this epic, not a footnote to CHAT-21. Epic rewritten around it. What changed:

## The biggest thing I'd missed

CHAT-29 settles doctrine that constrains every ticket, and its central claim cuts directly against the engineering instinct:

> **An 80%-faithful copy is worse than no copy** — "you've handed the customer a diff against something they already like. Their eye goes straight to the 20% that's wrong."

So partial fidelity isn't partial credit; on this surface it's negative. Which means the natural plan (ship the best duplication you can, iterate) is the wrong plan. CHAT-29's inversion instead: **the first output is a read-back, not a site** — a statement of comprehension ("here's what I see… what's working, what's been bugging you, what must not change?") that proves understanding before risking execution and *extracts the fidelity contract* so you know where to spend.

That composes cleanly with CHAT-21's migration-as-consent rather than contradicting it: read-back → fidelity contract → preview-with-the-fix-on-it → the ask. I've made that sequence §2 of the epic, ahead of all the engineering.

Two more that are cheap to honour and expensive to discover late: **"bring across", never "reproduce"** (fidelity bar you'll fail vs continuity bar you'll beat), and **never silently drop content** — the one thing that genuinely loses this customer.

## It also gives the self-check loop a better metric

I had workstream C anchored on pixel/value fidelity. CHAT-29's "never silently drop content" is **mechanically checkable** — the capture holds the full verbatim copy inventory — and it's the failure that actually costs you the customer. So the loop's round ordering is now: content completeness → semantic structure → value deltas → pixel regions. Pixel difference tells you *where to look*, not whether you succeeded.

## Three capture gaps, checked against current code

CHAT-29 tested against the real joyfulculinarycreations capture and named three. I verified each:

| Gap | Status |
|---|---|
| Images orphaned (hero was a CSS background, no box/role/owner) | ✅ closed by BUG-27 |
| `alt` text worthless — needs a vision captioning pass over `assets/` | ❌ not built (describer tool exists, nothing runs it over a bundle) |
| No **semantic outline** artifact (`hints.json` ancestry + `repeatCount` + geometry → "3 sibling cards, each `{image, heading, body×3}`") | ❌ not built |

The semantic outline is now the item I'd put first in the whole epic. It's much cheaper than the L1 fold because it only has to be *right about relationships*, never pixel-faithful — and it's what the read-back is made of, so it's inspectable by the customer. It sits ahead of the Elementor work, which addresses a different job (carrying across, not understanding).

Also worth taking as settled: **aesthetic capture needs no more extraction work.** Tokens are strong, the six screenshots do the heavy lifting, and the leverage is the prompt layer. One caveat now recorded — `freq` ranks repetition, not importance, so a single high-impact hero accent ranks near zero; read salience off the screenshot.

## Restructured

Two workstreams became three: **A. Understanding** (semantic outline, captioning, the read-back), **B. Bringing across** (the builder transforms), **C. Convergence** (your 2–3 rounds). Fourteen proposed child tickets in §9, still unfiled.

Open question 6 is now three-way rather than two: CHAT-5 wants duplication as the wedge, CHAT-29 says *don't offer reproduction at all*, CHAT-21 says migration must never be the ask. I think they reconcile — the diagnostic is the pitch, duplication is the mechanism, and the read-back is what's actually shown first — but that should be stated before any marketing copy exists.

I've also saved a note to memory so I stop treating a `.xgd/tickets` grep as authoritative: cold tickets live in the `xgd-stable` git snapshot and aren't files at all.

<!-- xgd-turn id="b86d231a-c44a-4756-a439-0e0c8c72c114-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:18:22.463229+00:00" -->
#### You
Please don't access ticket with file access that breaks so many things...

There are two feedback loops worth considering:
1 - feedback that improves the reproduction code itself
2 - use that AI to improve a reproduction using L1 and existing tools

1 - is for us to build the reproduction engine
2 - can be used to smooth the rough edges on a site that didn't reproduce as we would have liked

Note that neither involves reinforcement learning or rewards etc

<!-- xgd-turn id="b86d231a-c44a-4756-a439-0e0c8c72c114-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:21:07.152643+00:00" -->
#### Claude
Understood — CLI only for tickets from here.

And you're right that I conflated those two loops into one section. They're different in corpus, output, cadence, and who's watching. Let me check the current body state, then fix it.

Done — §7 is now the two loops, and the epic guards against the RL reading explicitly.

## The split, and why it matters more than it looked

|  | **Loop 1 — improve the engine** | **Loop 2 — smooth a site** |
|---|---|---|
| Corpus | our reference set | one customer's site |
| Cadence | dev time, batched, unattended | in-session, in front of the client |
| Durable output | **code** | **a site they recognise** |
| A per-site edit is… | **drift** — fix the engine or file it | **the deliverable** |
| Who adjudicates | us | the customer |

That last row is the sharp one. **The same action is correct in one loop and forbidden in the other.** What I'd written was a single undifferentiated "self-correcting reproduction loop" — which would have been wrong half the time, and wrong in the expensive direction: an agent that hand-patches during engine development produces a green result and no engine, which is exactly the DOC-19 failure mode.

## The bridge — and it's a log, not a signal

The loops connect in one direction only: **loop 2's hand-fixes are a histogram.** If the AI patches the same thing on site after site, that's an engine gap with a frequency attached — the prioritisation input loop 1 needs and doesn't otherwise have. Requires nothing clever: a named residual class, the site, the fix applied. Ranked frequency × cost, that list *is* the engine backlog.

And it's better-sourced than anything we could assemble ourselves, because it comes from the sites our customers actually have rather than the sites we chose. That's the §3 corpus distinction (this epic vs the DOC-15 flywheel) finally made operational rather than just asserted.

I've written the no-RL point in as a standing guard, not just a note — *"if a proposal under this epic starts talking about rewards, learned objectives or training signal, it has drifted — reject it."* Both loops are the ordinary shape: a deterministic check names a residual, an agent reads it and acts.

## One thing the split surfaced

Loop 2 is what makes §2.2's sequence work *before either loop has finished*. The preview we put in front of the client is a **smoothed** reproduction, not a raw one — so loop 2 is load-bearing for the read-back → preview → ask sequence, independently of how good the engine is. That argues it's less deferrable than its position in the list suggests.

Which is now open question 6: **which loop first?** Loop 1 compounds but is slow to show value; loop 2 makes the next demo work but doesn't accumulate. My read — build the shared harness once (it's most of both), point it at loop 1 first, let loop 2 follow once the fix-log shape is settled. Worth overriding if there's a demo date.

Child tickets are now C1–C6 (harness, completeness gate, loop-1 handoff, loop-1 gap filing, loop-2 smoothing, the fix log), still unfiled — say the word.

<!-- xgd-turn id="ba9eee72-08e0-466b-8f5c-caf92a1fd39c-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:38:00.779871+00:00" -->
#### You
Lets keep the number of tickets to a minimum and try to have testable content at the end of every ticket.

I'd like to sneak up on the automation rather than let it loose and "see what happens"

Imagine we create this UX for me

1) Blank page with a text box and a button [reproduce] - I enter the site name and it captures and runs a reproduction step
2) a series of links are added to the blank page under a title "Iteration 1", the urls are all set to open in new tabs if clicked on they are - the original site (for comparision) - the iteration 1 reproduction - the diff images
3) As soon as the links are added to the page an AI process is started up with a prompt to review the diff and close the gaps (we should learn from our transcripts on site reproduction how to get some of the nuances right and point the AI at the right things) - transcript of the AI output appears on the page.
4) When the AI finishes a button appears [run again] <-- note that this implies that the AI changes the code and reinstalls it so the next run uses its changes - we need a smoke/regression suite that the AI has to run to ensure that everything is in good shape before it finishes.

After going through this loop a few times, if its working we can let it rip

Lets start with just home pages.

<!-- xgd-turn id="ba9eee72-08e0-466b-8f5c-caf92a1fd39c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:40:45.288141+00:00" -->
#### Claude
Good — this is loop 1, human-gated at every round. Let me check a few mechanics before I write it up, since "the AI changes the code and reinstalls it" depends on how `1c` is built and what baseline we can regress against.

Three useful findings before the write-up:

Console design captured as §8, ticket list cut to three. Three things I found that change the plan:

## "Reinstall" is already free — with one trap

There's no build or install step to engineer. `1c` is TypeScript compiled **on the fly**: `bin/1c.mjs` boots a Vite SSR server and loads the CLI through `ssrLoadModule` (REQ-150). The AI edits a `.ts` file and the next `1c` invocation already uses it. That's a chunk of step 4 you don't have to pay for.

The trap is the mirror image: a **long-lived** dev server caches the module graph and silently keeps running the old code. Iteration N+1 would reproduce iteration N's result exactly, and the loop would look stuck for a reason nothing on the page could explain. So: fresh `1c` process per iteration, as a correctness requirement.

## The regression rail is the only genuinely new infrastructure — and the half that matters is missing

Half one exists: 517 UATs in `tests/`, ~73 reproduction-relevant by name.

Half two doesn't. The characteristic failure of a code-editing loop is that **the AI fixes the site in front of it and breaks the two it can't see** — and nothing currently records what a good gate result looks like per reference, so "no worse than before" isn't computable. I checked: no baseline, no recorded gate output anywhere in `storage/`.

The good news is it's checkable today, because three references are already stored — `faelan.com`, `gigabytealchemy.ai`, `joyfulculinarycreations.com`. Record a gate result per reference, re-gate all three every iteration, fail naming which regressed. Three sites is thin and it catches the failure mode that matters.

This is also why the AI's own verdict can't be the gate: an agent that both makes the change and judges it has no independent check.

## One addition to the UX: a fourth link

Step 4 implies the AI edits code, but the page as described shows only its prose. I'd add **"what the AI changed"** — the code diff — next to the other three links, with each iteration as one commit on a scratch branch. Being able to *see and revert* per iteration is what makes sneaking up on it real rather than nominal.

## The three tickets

| | | Testable at the end |
|---|---|---|
| **T1** | Console, no AI. Textbox → capture → reproduce → diff → link block. [run again] runs manually. | Enter joyfulculinarycreations.com, click each of the four links, see the real thing |
| **T2** | The regression rail: baseline per reference + one command | Green on main; break a serializer → red, **naming which reference regressed** |
| **T3** | The AI iteration: brief, reads diff, edits code, runs rail, commits, streams | One full round — transcript, non-empty code diff, rail green, Iteration 2 appears, numbers moved. Plus: **rail fails → AI doesn't get to finish** |

**Why three and not two:** T2 could fold into T3, but then the safety rail and the thing it restrains arrive in the same commit — the one ordering that can't be reviewed. And T1 earns its place by being useful with no AI at all; it collapses the setup cost of your current manual loop on day one.

I've also written the prompt up as a **deliverable rather than a detail** — distilled from DOC-19 plus the reproduction transcripts, carrying at minimum: transcribe from the DOM never the screenshot; read `regions` before `meanDifference`; `capture-incomplete` means stop, not iterate; fix the engine never the site; content completeness before pixels. That's a doc, not a string buried in the console.

One open question I couldn't settle without measuring: **is the per-iteration gate the ~73-test subset or all 517?** The rail runs every iteration so runtime is a real constraint, but a subset is exactly how a regression sneaks through. Worth timing before T2 is written.

Tickets not filed — the session is scoped to EPIC-12 and I'll leave creation to you.

<!-- xgd-turn id="af41ea5b-3006-4694-aa96-d15cacacc40b-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:45:14.854987+00:00" -->
#### You
Lets keep this cleanly separate from the production code, this is a dev tool it should not get accidentally deployed

<!-- xgd-turn id="af38daf3-55cd-42df-b153-23faff568fd4-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T01:45:28.304518+00:00" -->
#### You
Lets keep this cleanly separate from the production code, this is a dev tool it should not get accidentally deployed

Please create the tickets

<!-- xgd-turn id="af38daf3-55cd-42df-b153-23faff568fd4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T01:48:29.458085+00:00" -->
#### Claude
Important finding before I write this: `apps/control-app` imports **directly from `tools/generate/src/`** by relative path — so the engine the AI edits is itself deployed code. That splits your constraint into two different problems with two different answers.

Epic updated. Now creating the three tickets.

Three tickets filed and linked under EPIC-12:

| | | |
|---|---|---|
| **REQ-254** | Reproduction console: capture, reproduce home page, show the diff | no AI |
| **REQ-255** | Regression rail: baseline per reference + one command that says "no worse" | the safety rail |
| **REQ-256** | AI iteration: review the diff, change the engine, stop for the human | depends on both |

## Your isolation constraint splits in two, and only one half is solvable by layout

**Risk 1 — the console gets deployed.** Fixed by construction, and now asserted rather than intended. It lives in `tools/repro-console/`, never `apps/`; no wrangler config; **no build script** (since `pnpm-workspace.yaml` globs `tools/*`, it *will* be a workspace package and `pnpm -r build` *will* visit it — having no build script is what makes that visit a no-op); localhost only; dependency direction one-way. REQ-254 ships a UAT that fails if it acquires a build script or wrangler config, or if anything under `apps/` gains a dependency on it. A convention nobody checks is how dev tools reach production.

**Risk 2 — the AI's edits reach production.** This one directory layout cannot touch. `apps/control-app` imports the engine **directly from `tools/generate/src/`** by relative path — `store/d1r2-store`, `store/ids`, `publish/ladder`, `cli/capture/cf-driver`. So the engine the AI edits *is* deployed code. That coupling isn't a mistake to design away here: improving the engine is the whole point of loop 1, and the engine is legitimately shared.

What actually covers it: every iteration commits to a **scratch branch** with nothing auto-merging; **the rail includes a Worker build check** (`wrangler deploy --dry-run` is the cheap form) so "the AI broke the control app" surfaces in the round that caused it rather than at the next deploy; and no part of the console invokes a deploy. I've added that build check to REQ-255's behavior list — it's there because of this coupling, not as general hygiene.

## Two things I put in the tickets that weren't in your sketch

**The rail must be seen to fail.** REQ-255's acceptance requires both directions — green on main, *and* break a serializer and watch it go red naming which reference regressed. A rail only ever observed passing hasn't been tested, and this one is load-bearing.

**Baselines update only by deliberate human act.** Otherwise an automated run can move the bar it's being measured against, and the rail quietly becomes decorative.

I also kept the "what the AI changed" link in REQ-256 rather than REQ-254, since there are no code edits until the AI exists — keeps REQ-254 to your three links.

Worth noting one measurement that's still open and cheap to settle: REQ-255 asks you to **time the rail**, because whether the per-iteration gate is the ~73 reproduction-relevant UATs or all 517 should be decided on a number rather than a guess.

<!-- xgd-turn id="91e461e3-a622-4bda-94ed-cd8fce197e43-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T02:52:40.890122+00:00" -->
#### You
**Risk 2 — the AI's edits reach production.** I'm ok with that we are preproduction and the reproduction engine is terrible. Also production is deployed.

Lets stick with the xgd model: changes to the code must have a ticket and be free coded. Perhaps in v1 the AI should just create the ticket and I will trigger the free coding of it. Ok?

<!-- xgd-turn id="91e461e3-a622-4bda-94ed-cd8fce197e43-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T02:57:18.060040+00:00" -->
#### Claude
Confirmed — that's the right call, and it's cleaner than what I had. Let me work through what it changes before writing it.

Now REQ-256, which changes most, and a smaller touch to REQ-255.

Yes — and it's a better design than what I had, not just a compliance move. Updated EPIC-12 §8.1/§8.2/§8.4/§8.6/§9/§10, rewrote REQ-256, and trimmed the stale "AI edits code" framing out of REQ-254 and REQ-255.

## What the AI now produces

Its deliverable is a **gap ticket**, at `draft`, carrying: named residual class · which reference(s) exhibit it · the evidence (`check_fidelity` verdict, the `regions` entry, the `values-diff` lines) · hypothesis about the engine · proposed change. You free-code it; [run again] re-runs with whatever landed.

## Four things this buys that the edit-and-commit version didn't

- **Every engine fix acquires a UAT and matrix coverage.** A scratch-branch commit leaves nothing behind — which is exactly the drift §7.5 is anxious about. Free coding forces a named test per closed gap, so the engine accumulates regression evidence as a side effect of the loop.
- **Diagnosis and fix are judged by different agents.** The rail was doing that job awkwardly (an agent both making and grading its own change). The free-coding session is a genuinely independent reader of the claim.
- **The ticket *is* the fix log.** §7.3 wanted loop 2's hand-fixes recorded as a frequency-ranked engine backlog. That artifact now arrives for free, in the system that already ranks work.
- **No new machinery.** No scratch-branch convention, no bespoke revert path, no commit-message rules. The console stops at a boundary the project already enforces.

## Risk 2 dissolves, and I've recorded why rather than deleting it

The `apps/control-app` → `tools/generate/src/` coupling is real and permanent, and it's not a mistake to design away — the engine is legitimately shared. But with the AI authoring no code there's nothing of its authorship to reach anywhere. I kept the Worker build check in REQ-255's rail, now as ordinary hygiene: an engine change *can* break the control app, and the free-coding session should learn that in the round that caused it. Your "we're pre-production and production deploys separately" position is recorded in §8.6 as the reason this was never the acute risk.

## Three disciplines I wrote into REQ-256 that will bite if they're missing

**`capture-incomplete` files nothing.** That verdict means the reference is wrong, not the engine. Filing it as an engine gap would be a false report against a real ticket — worse than a wasted round.

**One ticket per gap class, not per iteration.** Otherwise five rounds on one site produce five tickets for the same defect and the reconciler inherits the mess.

**Never a `ready_*` status.** An AI process filing at `ready_to_implement` spawns `xgd develop` against its own half-formed diagnosis within ~30 seconds.

## The residual risk, named rather than hidden

A diagnose-only AI can write plausible tickets it never has to prove — in the edit model the rail was the immediate falsifier. The falsifier here is retrospective but real: if a ticket is free-coded and the next iteration's numbers don't move, the diagnosis was wrong, and the console shows that in the same place it showed the claim.

That's also now §9 Q8 — **when, if ever, does the AI get to edit code directly?** Framed not as "should it" but "what evidence would justify it": N consecutive rounds where the free-coded fix matched the proposal and the numbers moved as predicted. Until that's measured, the answer is no.

Ticket-only changes, so nothing to commit or free-code here.

<!-- xgd-turn id="811ce182-44d7-42cb-bba1-4baa7fcf3abc-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T22:18:33.903284+00:00" -->
#### You
Can you add REQ-261 and REQ-262 to your children and read the transcript from my conversation with REQ-256 please?

<!-- xgd-turn id="811ce182-44d7-42cb-bba1-4baa7fcf3abc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T22:20:35.666279+00:00" -->
#### Claude
Both done.

**`epic_children`** is now `[REQ-254, REQ-255, REQ-256, REQ-261, REQ-262]` — both already carried `epic_parent`, so only the epic's side was stale.

**Transcript read** — all 26 turns of COMMENT-3020 on REQ-256.

## What I took from it

**The loop is built and its headline behaviour doesn't work.** REQ-256 landed as `a215dda82a` (0.2.222) with 18 green UATs, but `parseOutcome` in `ai.ts` scans for fenced code blocks with a lazy `[\s\S]*?`. Every gap ticket the brief demands quotes `gate.json` in a fence, so the match stops at the first inner fence and the outcome truncates — 1,130 of 7,500 characters. The better the ticket, the more certain it fires. The UATs pass because every fixture uses `"body":"b"`, which the brief forbids.

**Your first live round succeeded and the console threw it away.** It found a real defect: `referenceCoverage()` builds its referenced-image set from `manifest.elements[].src` alone, so section imagery stored as `backgroundImageUrl` reads as unreferenced; `reconcileGates` checks coverage before value deltas, so the false finding hijacks the verdict to `capture-incomplete` — which this console's own brief treats as *stop, file nothing*. That silently disables loop 1 on every background-image site. The diagnosis is still sitting unfiled in `storage/tmp/.../iteration-1/ai/transcript.txt`.

**Two places the implementation improved on what §8.2 said.** The round hands back ticket *content* and the console runs `xgd ticket create --fields '{"status":"draft"}'` — so "never at `ready_*`" is structural, not a rule a round is asked to keep. And "the AI wrote no code" became a measured property rather than an instruction, after the prior session found that a tool merely *absent* from the allowlist still ran.

## Three loose ends I can see, none of which I've touched

**EPIC-12 §8.2 and REQ-256 behaviour 6 now contradict your correction.** I wrote *"one ticket per gap class, not per iteration"*; you settled on **one unbounded gap ticket per round**, plus separate bugs for anything it trips over in L1, `1c`, or its own brief. The first round's *"regions 1–5 and 9 are candidate classes for a later round"* is a defect under your reading, not a throttle working. The epic still says my version. Want me to correct §8.2 and REQ-256's body to match? Nothing else is editing the epic, so there's no collision risk there.

**The last question in that chat was never answered.** REQ-256 is still at `free_coded`. The offer was to append a note recording that its UATs don't cover the fenced-body case and REQ-261 owns the fix — so whoever reads the reconcile doesn't see green tests on a broken behaviour. Still worth doing before you promote.

**DOC-53 has no `epic_parent`** — its only field is `doc_kind: architecture`. It's the session KB document REQ-262 depends on, but it isn't attached to EPIC-12 or to anything else. Say the word and I'll parent it.

<!-- xgd-turn id="cb58eaa3-d5b9-43b0-99fe-8468a12c0762-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T22:29:58.994199+00:00" -->
#### You
Want me to correct §8.2 and REQ-256's body to match? <-- you can change the ticket to match what was built but any code changes need new tickets at this point I think - what is the change here?
ay the word and I'll parent it. <-- sure

<!-- xgd-turn id="cb58eaa3-d5b9-43b0-99fe-8468a12c0762-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T22:31:48.436872+00:00" -->
#### Claude
Let me check whether that correction is already ticketed before answering — REQ-261 is at `free_coded`, so some of it may already be built.

Confirmed in code — let me re-read REQ-256's body, since it's been rewritten since my version.

REQ-256's body has already been brought in line (requirement 4 now says the console runs `xgd`). Only the epic is stale — let me pull it fresh and patch.

**No code change — that's the answer.** The correction was already built.

REQ-261 behaviour 2 is that exact scope change, and REQ-261 is at `free_coded`. I verified it in the code rather than trusting the transcript: the brief at `tools/repro-console/src/ai.ts:357` now reads *"One gap ticket, and it is not bounded… Deferring is losing"*, there's a `bugs?: TicketDraft[]` on the outcome, and `console.ts:722 fileBugs()` files each one separately at `draft`. So the behaviour you corrected is live.

**REQ-256 also needed nothing.** Its body was rewritten after mine — requirement 4 already says the AI hands back the ticket's *content* and the console runs `xgd ticket create`, and requirement 26 already states the append rule is decided by the console against its registry. I re-read it before touching anything and left it alone.

**So only EPIC-12 §8.2 was stale**, and that's now fixed. Three changes:

- **"One ticket per round, and it is not bounded"** replaces my one-finding-per-round reading, with the deferring-is-losing rule and a note that it supersedes the earlier text.
- **The separate-bugs channel**, which I didn't have at all — including the first round's gate-misrouting find as the worked example of why it's needed.
- **The console-files-it refinement**, which is better than what I wrote: `draft` status becomes structural rather than a rule, and "the AI wrote no code" becomes measured rather than instructed.

I also added one clarification to §8.2 that the transcript showed causing real confusion: **a round is not a development session.** A round is a read-only diagnostic subprocess with `Read`/`Glob`/`Grep`; the free-coding session that implements its ticket is ordinary and has full `xgd`. Worth being explicit in the epic, since conflating them reads as "development sessions are crippled."

**DOC-53 is parented** — `epic_parent: epic-bf282b3d`, and added to `epic_children`, which is now six.

One thing still open from that chat, unrelated to the above: REQ-256 is at `free_coded` with green UATs on a parser that can't read a brief-conforming ticket. REQ-261 has since fixed it, so promoting is now safe — but nothing in REQ-256's body records that its own suite never covered the case. Say if you want that note appended before you promote.

<!-- xgd-turn id="000b7e8c-9aaf-4caf-96e2-84f2c3aee3cf-user" -->

<!-- xgd-chat role="user" ts="2026-09-16T23:01:01.713944+00:00" -->
#### You
ok good - can you review the state of the tickets and implementations and tell me where we are? Can I try an end to end test?

<!-- xgd-turn id="000b7e8c-9aaf-4caf-96e2-84f2c3aee3cf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-16T23:02:48.477451+00:00" -->
#### Claude
The lost round's transcript is still on disk. Let me check whether the fixed parser can actually recover it.

Ran the five suites and checked the code rather than trusting ticket statuses. **Yes, you can run end to end — one command first.**

## Where the tickets are

| | | |
|---|---|---|
| **REQ-254** console | `ready_to_reconcile` | landed |
| **REQ-255** rail | `free_coded` | landed |
| **REQ-256** AI round | `free_coded` | landed |
| **REQ-261** parser/resume/bugs | `free_coded` | landed, v0.2.227 |
| **REQ-262** priming + KB | `draft` | **not built** |
| **DOC-53** session KB doc | `draft` | skeleton; pipeline map still TO BE WRITTEN |

## What's actually in the tree

All of REQ-261 is real, not just ticketed — I checked each item: the balanced-brace parser replaced the fence regex (`ai.ts:626`), resume is wired (`session.ts`, `--resume`, a distinct preamble, `RESUME_MAX_ROUNDS`), the `bugs` list and `fileBugs()` exist, model/cost/turns are read off the stream, `digest.ts` writes the evidence pre-digest, and there's a `/iteration/N/recover` route behind a **[read it again]** button.

**101 UATs pass across the five suites** (7.9s). `claude` is on your PATH, Playwright Chromium is installed, `vite` is present for the launcher, `1c gate` exists, and all three references are stored.

## The one thing blocking you

`storage/rail/` doesn't exist — there's no recorded baseline, so the rail will honestly report `REGRESSED · no baseline` on every iteration.

```
./bin/repro-rail record      # then:  ./bin/repro-console
```

That's the explicit human act the rail's own usage text describes. It re-gates all three references, so give it a few minutes.

## A free win before you spend anything

**Your lost round is recoverable, and I verified it rather than assuming.** I ran the fixed parser against the actual transcript on disk:

```
RECOVERED  status = filed
title      : gate: reference coverage counts section background images as unreferenced
body       : 6346 chars intact
```

The run directory `repro-gigabytealchemy-ai/iteration-1` is still there with its `outcome.json` frozen at *"the round produced no outcome block."* Start the console, it re-reads that run from disk, and **[read it again]** on Iteration 1 files the ticket from the stored transcript — spawning nothing, paying nothing. That gets the real gate defect ticketed before you run anything new.

## What to expect that isn't a bug

**Rounds are unprimed.** REQ-262 is `draft`, so there's no session KB and no engine map — a round finds its way by grepping and will re-derive the same bearings every time. It works; it costs more than it should. That's the whole point of REQ-262, and running now gives it the cost baseline to be measured against, since REQ-261's telemetry now records model, cost, turns and tokens per round.

One sequencing note: REQ-254 sits at `ready_to_reconcile` while the three that build on it are at `free_coded`. Doesn't affect a test run — all the code is on `xgd-working` — but it's worth reconciling in order.

<!-- xgd-turn id="b278756f-0d2e-4c5e-8a0e-e932f2ac525a-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T01:25:07.762732+00:00" -->
#### You
Can you do another pass 262 is implemented I was going to try again? Let me know if we are r4eady for another e2e test?

<!-- xgd-turn id="b278756f-0d2e-4c5e-8a0e-e932f2ac525a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T01:27:51.866389+00:00" -->
#### Claude
`Bash` is now in the allow list — that changes a claim I wrote into the epic last turn. Let me read the full rationale.

Everything's green and REQ-262 landed cleanly. One thing I need to fix first — a claim I put in the epic last turn is now false.

**Ready — same single prerequisite as before, which hasn't been done yet.**

```
./bin/repro-rail record      # storage/rail/ still does not exist
./bin/repro-console
```

## REQ-262 landed clean

`free_coded` at 0.2.230. **121 UATs pass across all seven console suites**, none skipped. New: `session-kb.ts`, `brief/DIAGNOSE-THE-GAP.md`, and `measurements/tool-gating.sh`.

**DOC-53 is finished** — 16KB, no `TO BE WRITTEN` left. The pipeline map is real: capture / fold / L1 / probes / gate, plus §1.6 on the field-level distinctions that cost the first round tool calls, and three learnings written as method.

**The KB design is "no membership to maintain"** — every DOC ticket is materialized to `kb/<DOC-ID>.md` (50 of them), and the prompt names only the **index**, with an explicit *"do not read the corpus."* If `xgd` won't list, the round runs on whatever's on disk and says so — a missing KB can't fail a round.

## One change you should know about before you run

**REQ-262 D7 gave the round `Bash`, and that narrows REQ-256 behaviour 3.** The reasoning is sound and documented: the round needs the ticket store (your first round found the same false positive had shipped unfixed once before), `xgd` needs a shell, and it was *measured* that `Bash(xgd ticket get:*)` admits `Bash` wholesale without enforcing the prefix — so there was no scoped version to grant.

The cost is stated plainly in the code: **"the round writes no code" stops being a property of the process and becomes an instruction in the brief.** The engine it's diagnosing is now editable by it. What bounds that is the working-tree diff checked after every round and shown in red, the `ready_*` status assertion, and `test_fix` eliminating un-ticketed drift.

I'd flagged the old, stronger claim into EPIC-12 §8.2 last turn. **That's now corrected** — the epic records the grant, why it couldn't be narrow, and which checks became load-bearing.

## Two things to settle, neither blocking

**REQ-256's ticket body is now out of date with its own tests.** Behaviour 3 and requirement 17 still say the round gets *"reading tools and nothing else"* and *"cannot run `xgd`"*. REQ-262's session amended REQ-256's **test** to assert `['Read','Glob','Grep','Bash']` — with a good comment explaining why — but left the body. So a UAT no longer traces to its ticket language, and REQ-256 is sitting at `free_coded` headed for reconcile, which will read the contradiction as drift. Want me to update REQ-256's body to match what was built? Doc-only, and it's the case you've already sanctioned.

**Your lost round is still recoverable** and still free. `repro-gigabytealchemy-ai/iteration-1` is on disk with its `outcome.json` frozen at *"no outcome block"*; I re-confirmed the parser now recovers `status: filed` with the 6,346-char body intact. Press **[read it again]** on Iteration 1 before starting anything new — it files from the stored transcript without spawning a round.

One expectation for this run: rounds now resume across iterations of the same site, so Iteration 2 continues Iteration 1's session rather than re-reading the brief. If numbers look anchored rather than re-derived, that's the resume trade-off REQ-261 flagged, not a regression.

<!-- xgd-turn id="1190fd92-37ff-4dec-9061-54b2bb1e51c6-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T01:40:16.818526+00:00" -->
#### You
**REQ-256's ticket body is now out of date with its own tests.** Behaviour 3 and requirement 17 still say the round gets *"reading tools and nothing else"* and *"cannot run *`xgd`*"*. <-- please fix this it will confuse reconciliation no end

<!-- xgd-turn id="1190fd92-37ff-4dec-9061-54b2bb1e51c6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-17T01:42:16.869352+00:00" -->
#### Claude
Now the same overstatement in EPIC-12 §8.6, which still says Risk 2 is dissolved.

Fixed. Every remaining hit is the corrected text describing what changed, not a stale claim.

## What I changed in REQ-256

Four passages, all describing the same thing — the tool grant:

- **Behaviour 3** keeps *"the AI writes no code"* but now records its standing: an instruction checked after the fact, not a property of the tool set, amended by REQ-262 D7. It names what holds it — requirement 18's working-tree comparison, which was defence in depth and is now load-bearing.
- **Requirement 17** rewritten to the real grant: `Read`, `Glob`, `Grep`, `Bash`. Why `Bash` (the round needs the ticket store — your first round found prior art on its own defect), why it couldn't be narrow (`Bash(xgd ticket get:*)` admits `Bash` wholesale), **both measurements** with their numbers, and what the grant costs stated plainly. Filing stays the console's job.
- **Requirement 20** no longer justifies the console owning the ticket id with *"the round has no tool that could have created a ticket"* — which is now false. It's asserted rather than assumed, precisely because the round *could* reach `xgd`.
- **Requirement 14** said Risk 2 was *dissolved*. It's **bounded** — instruction plus working-tree falsifier, authoring tools denied by name, un-ticketed edits eliminated as drift, real changes arriving by free coding.

I kept the old claim visible in each case (*"as originally written this said dissolved…"*) rather than silently overwriting. Reconciliation reads a body against code and a history; an amendment it can see the shape of is easier to trust than a body that was always right.

## Also corrected EPIC-12 §8.6

Same overstatement, same fix — the heading went from *"Dissolved by §8.2"* to *"Bounded, not dissolved"*, with the four things that actually bound it. Your recorded position on why the trade is acceptable (pre-production, engine is poor, production deploys by explicit human act) is retained and now reads as the justification for D7 rather than as a reason the risk was absent.

**35 UATs still green** after the body edits — the tests were already asserting the amended policy, so this closes the gap in the direction of the code rather than against it.

Nothing else changed. Still the one prerequisite before your run:

```
./bin/repro-rail record
./bin/repro-console
```

<!-- xgd-turn id="1f2f3648-8b3f-496a-a9de-ce336aac56e2-user" -->

<!-- xgd-chat role="user" ts="2026-09-17T21:40:40.624405+00:00" -->
#### You
REQ-265 is the gap ticket, it was created by the repro system - but it says created_by martin-github@westhead.me - can you create a bug to fix that please?

<!-- xgd-chat-end -->