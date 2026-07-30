---
uid: comment-aef798fe
id: COMMENT-593
type: comment
title: Comment on chat CHAT-12
created_by: xgd
created_at: '2026-07-30T20:45:09.110078+00:00'
updated_at: '2026-07-30T20:50:46.290632+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: chat-4ddcde8c
  kind: chat_transcript
---

<!-- xgd-turn id="e587e9c8-3ff1-4cb5-97a2-04aca1d5b84d-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T20:45:07.086840+00:00" -->
#### You
Lets talk about the copy on the xgd website right now. Please review the chat transcript for REQ-95 which is where we have done most of the work - it will point you at the core references you need

<!-- xgd-turn id="9f15fd6f-613d-4f27-a34e-313dede9d298-user" -->

<!-- xgd-chat role="user" ts="2026-07-30T20:46:34.198473+00:00" -->
#### You
Lets talk about the copy on the xgd website right now. Please review the chat transcript for REQ-95 which is where we have done most of the work - it will point you at the core references you need

Once you have the context, please review the site copy that we have created and we can discuss.

The core requirements for the site are (1) to tell the story of what the tool is and give an intuition as to how it works (2) generate interest (3) capture email addresses for signups

<!-- xgd-turn id="9f15fd6f-613d-4f27-a34e-313dede9d298-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-30T20:50:46.255722+00:00" -->
#### Claude
I'll start by finding the REQ-95 chat transcript.

Now let me pull the actual copy off the page and the positioning docs it's meant to serve.

I've read the REQ-95 transcript end to end, DOC-9 (the messaging keystone), DOC-7 (GTM), and pulled the live copy tree plus the form module config off `storage/sites/xgd/draft/pages/home.json`.

One thing I couldn't do: render a screenshot. Playwright isn't installed in this repo's `node_modules` and I won't install it without your say-so, so this review is off the copy tree and the served HTML, not the composition. Everything below is text-level.

## The page as it stands

Spine: hero → problem → how → proof → contract → close/signup. That's a sound structure and the prose is genuinely well made — "Code got cheap. Confidence didn't." is the best line on the page after the H1, and the four-step chain (Capability → User story → Acceptance criteria → Verification) is the strongest intuition asset you have. The hero survived a hard-fought process and I wouldn't reopen it.

Against your three requirements, though, they're in reverse order of health: the story is good-with-holes, interest is under-served, and email capture is the weakest by a distance.

## (1) Story and intuition

**The three-act spine is missing entirely.** DOC-9 §2 calls it "the line that carries the whole thing" — vibe coding removed the reviewer and lost the guarantees; agentic engineering restored the guarantees by restoring the reviewer; XGD gives you both. Nothing on the page names vibe coding or agentic engineering, so the reader never learns what XGD is an *alternative to*. They arrive asking "is this Cursor? Devin? a test framework? a linter?" and leave without an answer. Every one of those competitors also claims to solve "confidence at generated volume." The contrast **is** the differentiation, and it's the one thing on the page only you can say.

**The problem section asks three questions the how section doesn't answer.** Intent evaporates / tests drift / review stops scaling — then four steps that never close any of those loops explicitly. "Tests drift" in particular is set up perfectly and then abandoned: the answer to it (DOC-5 §2.1, *the matrix cannot diverge silently; it is not maintained by discipline*) is the strongest argument in your whole corpus and appears nowhere on the page.

**"Living spec" is asserted three times and never earned.** The reader's default model for "spec" is homework — a document they have to maintain. You caught exactly this in the hero and fixed it by grammar ("XGD *maintains*"), but the fix never propagated below the fold. Below the hero, nothing tells the reader why this one can't rot.

**The reader never learns what XGD physically is.** No CLI, no repo, no language, no screenshot, no "works with your existing GitHub project." Someone fully persuaded by the argument still can't picture using it. And "Evidence, not promises" heads a section containing no evidence — you flagged that yourself at the end of REQ-95 and it's still true.

**No qualify-out.** DOC-9 §5 is emphatic that the page must repel magic-wand seekers, and warns the cost is churn and your worst reviews. The hero does implicit qualify-in via "you own the architecture." Nothing anywhere does the explicit half. You'd recommended a "who this is for" section below the fold; it never got built.

## (2) Interest

**The hero sub front-loads mechanism where the stake should be.** Twenty-five words of *how* — using an undefined term, "living spec" — before anything about why the reader cares. The second sentence ("You own that intent and the architecture; XGD owns the implementation") is the sharper hook and it's sitting at the back.

**Your best asset is whispered.** DOC-9 §8 calls the built-with-itself proof "likely our single best piece of collateral." On the page it's section four of six, and the killer quote is in a small block. It also carries **no number** — not nine months, not a test count, not a capability count. It's the one section where a number would do more work than any sentence.

**Everything is the same temperature.** Six sections, each: eyebrow → aphoristic headline → ~35-word paragraph → grid of items. Uniformly cool, declarative, abstract. Apart from "a thousand lines before lunch" and "the ninety thousand already there," there is not one concrete noun, scenario, or artifact on the page. Crafted abstraction reads as *confident* on the first scan and as *evasive* on the second — and a technical audience does the second scan. The wall from DOC-4 is described obliquely but never given the moment of "that happened to me last Tuesday." One concrete anecdote would outperform all three abstract problem items.

## (3) Email capture — the weakest leg

**"Read the whitepaper" goes to a section with no whitepaper.** Verified: `cta-secondary` and the nav "Whitepapers" both link `#papers`, and `id="papers"` is the *Proof* section — "XGD was built with XGD." No title, no abstract, no download, no form. Two of your five links break their promise at the exact moment of intent.

**The papers are never named.** DOC-4 is titled "How Can You Trust the Code Your AI Writes?" — that title is itself marketing, and it's more compelling than most of the page. Right now you're offering an anonymous "the whitepapers." Naming two papers with a one-line abstract each is probably the single highest-leverage capture change available: it turns "give us your email" into "give me *that*."

**One box, three asks.** "Join the beta — and get the whitepapers" bundles a low-friction ask (send me a PDF) with a high-commitment one (put me on a list), plus an optional third ("tell us what you're building"). The paper-seeker hesitates at the beta implication; the beta-seeker doesn't want papers.

**And the fulfilment doesn't match the promise.** A reader clicks a button saying **"Join the beta waitlist"**, lands on a form whose submit says **"Send me the whitepapers"** and whose success message is "the papers are on their way." The beta half of the ask silently disappears at the point of action. Also worth noting both fields use `labelMode: "placeholder"` — the label vanishes the moment they start typing.

The one genuinely excellent piece of microcopy on the page is "One email. We'll send the papers straight back." Concrete, low friction, honest. More of that.

## Three positioning inconsistencies worth resolving before we edit

1. **The contract table contradicts DOC-9 §6.** The page gives XGD "Technical design and sprint planning" while you own "the architecture and its constraints." DOC-9 puts *technology and API choices* firmly with the human. Architecture-vs-technical-design is precisely the boundary a skeptical engineer will interrogate, and right now the two columns blur it.

2. **"Sprint planning" is the only process word on a process-free page** — and it quietly reveals that XGD is a methodology you must adopt, not a tool you bolt on. DOC-9 §3 treats that fusion as the moat. The page never says it. Given §5's "honest positioning is cheaper than refunds," I think it should be stated deliberately rather than leak out of a bullet.

3. **"The ninety thousand already there" invites brownfield readers** that DOC-7 says you can't yet serve — enterprise waits "once legacy CM gaps are filled," and the launch target is founders and greenfield. That line is the most vivid in the problem section and it may be writing a cheque the product can't cash. Worth your call on whether it's aspirational or a claim to soften.

## What I'd change, ranked

1. Fix the `#papers` target and name the two papers — biggest capture win, smallest edit.
2. Split the ask: paper download as the low-friction primary, beta waitlist as a checkbox or a separate line. Align the button and success copy with whichever the reader clicked.
3. Add the three-act contrast — probably as the opening of the problem section, or its own short band. This is the missing story beat.
4. Make the proof loud, and put a number in it.
5. Answer "why can't this spec go stale?" explicitly in the how section — it's the claim the whole product rests on.
6. Rebalance the hero sub toward stake-first.
7. Add a "who this is for / not for" band.
8. Break the six-section monotony with one concrete artifact — a capability-matrix screenshot would serve items 4 and 5 at once.

## Where I'd like your steer

- **How hard do we lean on the vibe-coding contrast?** DOC-9 says hook with it and pivot fast, never anchor the category to it. That's a fine line and it changes the shape of the problem section.
- **Is the primary conversion the paper or the beta?** I'd make it the paper — lower friction, self-qualifying, and the beta has no date to create urgency with. But that's a GTM call, not a copy one.
- **Brownfield: aspiration or claim?** Affects the problem section's most vivid line.
- Do you want me to work up rewrites of specific sections, or agree the structural changes first?

Nothing changed on disk — this is analysis only. CHAT-12's body is still empty; say the word and I'll record the review conclusions there before we start editing.

<!-- xgd-chat-end -->