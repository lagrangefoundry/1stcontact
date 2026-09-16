---
uid: comment-91b0ef0c
id: COMMENT-3010
type: comment
title: Comment on epic EPIC-12
created_by: xgd
created_at: '2026-09-16T01:00:43.968268+00:00'
updated_at: '2026-09-16T01:38:01.037928+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-bf282b3d
  kind: chat_transcript
---

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

<!-- xgd-chat-end -->