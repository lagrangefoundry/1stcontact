---
uid: comment-91b0ef0c
id: COMMENT-3010
type: comment
title: Comment on epic EPIC-12
created_by: xgd
created_at: '2026-09-16T01:00:43.968268+00:00'
updated_at: '2026-09-16T01:10:18.651729+00:00'
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

<!-- xgd-chat-end -->